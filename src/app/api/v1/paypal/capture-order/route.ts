import { NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { updateUserSubscription } from '@/lib/subscription';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId, planId } = await request.json();

        if (!orderId || !planId) {
            return NextResponse.json({ error: 'Missing orderId or planId' }, { status: 400 });
        }

        // Capture the payment
        const captureData = await capturePayPalOrder(orderId);

        if (captureData.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        // Update the user's subscription with verified payment flag
        const subscription = await updateUserSubscription(planId, true);

        return NextResponse.json({ success: true, subscription });
    } catch (error: any) {
        console.error('PayPal capture order error:', error);
        return NextResponse.json({ error: error.message || 'Failed to capture PayPal order' }, { status: 500 });
    }
}
