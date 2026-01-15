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

        const { items, paymentMethod, currency } = await request.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // For simplicity, we create one order for the entire cart
        // In a real app, you might want to handle multiple items differently
        const totalAmountCents = items.reduce((sum: number, item: any) => sum + item.price_cents * item.quantity, 0);
        const firstItem = items[0];

        const result = await createPaymentOrder({
            userId: user.id,
            type: firstItem.type, // Assuming all items are of the same type for now
            productId: firstItem.id,
            productType: firstItem.type,
            productName: items.length > 1 ? `${firstItem.name} and ${items.length - 1} more` : firstItem.name,
            amountCents: totalAmountCents,
            currency: currency || 'USD',
            provider: paymentMethod,
            items: items,
            metadata: {
                cart_items: items
            }
        });

        return NextResponse.json({
            success: true,
            orderId: result.order.id,
            redirectUrl: result.redirectUrl,
            providerOrderId: result.providerOrderId,
            metadata: result?.metadata

        });

    } catch (error: any) {
        console.error('Checkout API error:', error);
        return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
    }
}
