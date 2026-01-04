import { NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId, productId } = await request.json();

        if (!orderId || !productId) {
            return NextResponse.json({ error: 'Missing orderId or productId' }, { status: 400 });
        }

        // 1. Capture the payment
        const captureData = await capturePayPalOrder(orderId);

        if (captureData.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        // 2. Get product details to know how many credits to add
        const { data: product } = await supabase
            .from('credit_products')
            .select('credits_amount')
            .eq('id', productId)
            .single();

        if (!product) {
            throw new Error('Product not found after payment');
        }

        // 3. Update the user's credit balance
        const { data: currentCredits } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        const currentBalance = currentCredits?.balance || 0;

        const { data: updatedCredits, error } = await supabase
            .from('user_credits')
            .update({
                balance: currentBalance + product.credits_amount,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, balance: updatedCredits.balance });
    } catch (error: any) {
        console.error('Credits capture order error:', error);
        return NextResponse.json({ error: error.message || 'Failed to capture PayPal order' }, { status: 500 });
    }
}
