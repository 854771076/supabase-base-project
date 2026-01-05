import { NextResponse } from 'next/server';
import { createPaymentOrder, paymentTypeSchema } from '@/lib/payment';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const createOrderSchema = z.object({
    type: paymentTypeSchema,
    productId: z.string().uuid()
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, productId } = createOrderSchema.parse(body);

        let amountCents: number;
        let productType: string;
        let productName: string;

        if (type === 'subscription') {
            const { data: plan } = await supabase
                .from('plans')
                .select('*')
                .eq('id', productId)
                .single();

            if (!plan) {
                return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
            }

            if (plan.price_cents === 0) {
                return NextResponse.json({ error: 'Free plan does not require payment' }, { status: 400 });
            }

            amountCents = plan.price_cents;
            productType = 'plan';
            productName = plan.name;
        } else {
            const { data: product } = await supabase
                .from('credit_products')
                .select('*')
                .eq('id', productId)
                .single();

            if (!product) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            amountCents = product.price_cents;
            productType = 'credit_product';
            productName = product.name;
        }

        const result = await createPaymentOrder({
            userId: user.id,
            type,
            productId,
            productType,
            productName,
            amountCents
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Create payment order error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to create payment order' }, { status: 500 });
    }
}
