import { NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';
import { getPlans } from '@/lib/subscription';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId } = await request.json();
        const plans = await getPlans();
        const plan = plans.find((p) => p.id === planId);

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        if (plan.price_cents === 0) {
            return NextResponse.json({ error: 'Free plan does not require payment' }, { status: 400 });
        }

        const amount = (plan.price_cents / 100).toFixed(2);
        const order = await createPayPalOrder(amount);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('PayPal create order error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create PayPal order' }, { status: 500 });
    }
}
