import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { createPaymentOrder } from '@/lib/payment';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { items, paymentMethod, currency, shipping_address_id } = await request.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // Determine if this is a product order
        const productItems = items.filter((item: any) => item.type === 'product');
        const isProductOrder = productItems.length > 0;

        // Validate shipping address for product orders
        if (isProductOrder && !shipping_address_id) {
            return NextResponse.json({ error: 'Shipping address is required for product orders' }, { status: 400 });
        }

        const adminSupabase = await createAdminClient();

        // Pre-payment stock validation
        if (isProductOrder) {
            const productIds = productItems.map((item: any) => item.id);
            const { data: products, error: stockError } = await adminSupabase
                .from('products')
                .select('id, name, stock_quantity, status')
                .in('id', productIds);

            if (stockError) {
                console.error('Error checking stock:', stockError);
                return NextResponse.json({ error: 'Failed to verify stock' }, { status: 500 });
            }

            for (const item of productItems) {
                const product = products?.find(p => p.id === item.id);
                if (!product) {
                    return NextResponse.json({ error: `Product ${item.name} not found` }, { status: 400 });
                }
                if (product.status !== 'published') {
                    return NextResponse.json({ error: `Product ${item.name} is no longer available` }, { status: 400 });
                }
                if (product.stock_quantity < item.quantity) {
                    return NextResponse.json({
                        error: `Insufficient stock for ${item.name}. Available: ${product.stock_quantity}`
                    }, { status: 400 });
                }
            }
        }

        // For simplicity, we create one order for the entire cart
        const totalAmountCents = items.reduce((sum: number, item: any) => sum + item.price_cents * item.quantity, 0);
        const firstItem = items[0];

        const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

        // Determine order type - use 'product' if any item is a product
        const orderType = isProductOrder ? 'product' : firstItem.type;

        const result = await createPaymentOrder({
            userId: user.id,
            type: orderType,
            productId: firstItem.id,
            productType: firstItem.type,
            productName: items.length > 1 ? `${firstItem.name} and ${items.length - 1} more` : firstItem.name,
            amountCents: totalAmountCents,
            currency: currency || 'USD',
            provider: paymentMethod,
            items: items,
            metadata: {
                cart_items: items,
                shipping_address_id: shipping_address_id || null,
                return_url: `${origin}/checkout?order_id={order_id}&status=success`,
                cancel_url: `${origin}/checkout?order_id={order_id}&status=cancel`,
            }
        });

        // For product orders, create order items and link shipping address
        if (isProductOrder && result.order) {
            const adminSupabase = await createAdminClient();

            // Update order with shipping address
            await adminSupabase
                .from('orders')
                .update({ shipping_address_id })
                .eq('id', result.order.id);

            // Create order items for each product
            const productItems = items.filter((item: any) => item.type === 'product');
            if (productItems.length > 0) {
                const orderItems = productItems.map((item: any) => ({
                    order_id: result.order.id,
                    product_id: item.id,
                    product_name: item.name,
                    product_thumbnail: item.image || null,
                    quantity: item.quantity,
                    unit_price_cents: item.price_cents,
                    total_price_cents: item.price_cents * item.quantity,
                }));

                await adminSupabase
                    .from('order_items')
                    .insert(orderItems);
            }
        }

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
