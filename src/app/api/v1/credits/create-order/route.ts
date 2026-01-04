import { NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await request.json();

        // Get product details
        const { data: product } = await supabase
            .from('credit_products')
            .select('*')
            .eq('id', productId)
            .single();

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const amount = (product.price_cents / 100).toFixed(2);
        const order = await createPayPalOrder(amount);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Credits create order error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create PayPal order' }, { status: 500 });
    }
}
