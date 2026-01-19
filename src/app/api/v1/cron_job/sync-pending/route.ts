import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { capturePaymentOrder } from '@/lib/payment';
import { CronLogger } from '@/utils/cron-logger';

export async function GET(request: NextRequest) {
    const logger = new CronLogger('sync-pending-orders');
    try {
        const authHeader = request.headers.get('Authorization');

        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await logger.logStart('Starting sync of pending TokenPay orders');

        const supabase = await createAdminClient();

        // Fetch pending TokenPay orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'pending')

        if (error) throw error;

        const results = [];
        for (const order of orders) {
            try {
                const result = await capturePaymentOrder({
                    orderId: order.id,
                    providerOrderId: order.provider_order_id,
                    userId: order.user_id,
                    type: order.type,
                    productId: order.product_id,
                    amountCents: order.amount_cents,
                    provider: order.provider,
                });
                results.push({ orderId: order.id, status: result.order.status });
            } catch (e: any) {
                results.push({ orderId: order.id, status: 'error', message: e.message });
            }
        }

        await logger.logSuccess(`Processed ${results.length} orders`);
        return NextResponse.json({ success: true, processed: results.length, results });
    } catch (error: any) {
        console.error('Sync pending orders error:', error);
        await logger.logFailure(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
