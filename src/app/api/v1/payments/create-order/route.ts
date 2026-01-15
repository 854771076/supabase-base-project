import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createPaymentOrder } from '@/lib/payment';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, productId } = await request.json();

        // Get product details
        const adminSupabase = await createClient();
        let product;
        if (type === 'subscription') {
            const { data } = await adminSupabase.from('plans').select('*').eq('id', productId).single();
            product = data;
        } else {
            const { data } = await adminSupabase.from('credit_products').select('*').eq('id', productId).single();
            product = data;
        }

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const result = await createPaymentOrder({
            userId: user.id,
            type,
            productId,
            productType: type,
            productName: product.name,
            amountCents: product.price_cents,
            provider: 'paypal',
        });

        return NextResponse.json({
            order: result.order,
            paypalOrder: {
                id: result.providerOrderId,
                status: 'CREATED',
            }
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
