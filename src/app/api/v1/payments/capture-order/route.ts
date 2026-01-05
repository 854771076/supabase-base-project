import { NextResponse } from 'next/server';
import { capturePaymentOrder } from '@/lib/payment';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const captureOrderSchema = z.object({
    orderId: z.string().uuid(),
    providerOrderId: z.string()
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, providerOrderId } = captureOrderSchema.parse(body);

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status === 'completed') {
            return NextResponse.json({ error: 'Order already completed' }, { status: 400 });
        }

        const result = await capturePaymentOrder({
            orderId,
            providerOrderId,
            userId: user.id,
            type: order.type,
            productId: order.product_id,
            amountCents: order.amount_cents
        });

        return NextResponse.json({
            success: true,
            order: result.order
        });
    } catch (error: any) {
        console.error('Capture payment order error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to capture payment order' }, { status: 500 });
    }
}
