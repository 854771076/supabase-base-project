import { NextRequest, NextResponse } from 'next/server';
import { capturePaymentOrder } from '@/lib/payment';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId, providerOrderId } = await request.json();

        // Get order details to get type and amount
        const adminSupabase = await createClient();
        const { data: order } = await adminSupabase.from('orders').select('*').eq('id', orderId).single();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const result = await capturePaymentOrder({
            orderId,
            providerOrderId,
            userId: user.id,
            type: order.type,
            productId: order.product_id,
            amountCents: order.amount_cents,
            provider: order.provider,
        });

        return NextResponse.json({ success: true, order: result.order });
    } catch (error: any) {
        console.error('Capture order error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
