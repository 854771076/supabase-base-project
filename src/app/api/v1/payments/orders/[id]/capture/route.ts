import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { capturePaymentOrder } from '@/lib/payment';

/**
 * Capture a payment order
 * POST /api/v1/payments/orders/[id]/capture
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch order to get provider details
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !order) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        if (order.status === 'completed') {
            return NextResponse.json(
                { success: true, data: order, message: 'Order already completed' },
                { status: 200 }
            );
        }

        if (order.status === 'failed' || order.status === 'cancelled') {
            return NextResponse.json(
                { success: false, error: `Order is in ${order.status} state` },
                { status: 400 }
            );
        }

        // Capture payment
        const result = await capturePaymentOrder({
            orderId: order.id,
            providerOrderId: order.provider_order_id,
            userId: user.id,
            type: order.type,
            productId: order.product_id,
            amountCents: order.amount_cents,
            provider: order.provider,
        });

        return NextResponse.json(
            { success: true, data: result.order },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error capturing order:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to capture order' },
            { status: 500 }
        );
    }
}
