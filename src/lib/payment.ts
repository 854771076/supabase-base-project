import { createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { PayPalProvider } from './payment/providers/paypal';
import { TokenPayProvider } from './payment/providers/tokenpay';
import { PaymentProvider, PaymentOrder } from './payment/types';

export const paymentTypeSchema = z.enum(['subscription', 'credits']);
export const paymentStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']);

export type PaymentType = z.infer<typeof paymentTypeSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

const providers: Record<string, PaymentProvider> = {
    paypal: new PayPalProvider(),
    tokenpay: new TokenPayProvider(),
};

function getProvider(name: string): PaymentProvider {
    const provider = providers[name];
    if (!provider) {
        throw new Error(`Payment provider ${name} not found`);
    }
    return provider;
}

interface CreatePaymentParams {
    userId: string;
    type: PaymentType;
    productId: string;
    productType: string;
    productName: string;
    amountCents: number;
    currency?: string;
    provider: string;
    metadata?: Record<string, any>;
    items?: any[];
}

interface CapturePaymentParams {
    orderId: string;
    providerOrderId: string;
    userId: string;
    type: PaymentType;
    productId: string;
    amountCents: number;
    provider: string;
}

export async function createPaymentOrder(params: CreatePaymentParams) {
    const {
        userId,
        type,
        productId,
        productType,
        productName,
        amountCents,
        currency = 'USD',
        provider: providerName,
        metadata = {},
        items = []
    } = params;

    const adminSupabase = await createAdminClient();
    const provider = getProvider(providerName);

    // Create local order first
    const { data: order, error } = await adminSupabase
        .from('orders')
        .insert({
            user_id: userId,
            type,
            provider: providerName,
            status: 'pending',
            amount_cents: amountCents,
            currency,
            product_id: productId,
            product_type: productType,
            product_name: productName,
            metadata
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating order:', error);
        throw new Error('Failed to create order');
    }

    // Replace {order_id} placeholder in metadata if present
    const processedMetadata = { ...metadata };
    Object.keys(processedMetadata).forEach(key => {
        if (typeof processedMetadata[key] === 'string') {
            processedMetadata[key] = processedMetadata[key].replace('{order_id}', order.id);
        }
    });

    // Create order with provider
    const providerResponse = await provider.createOrder({
        id: order.id,
        userId,
        amountCents,
        currency,
        status: 'pending',
        type,
        items,
        metadata: processedMetadata
    });

    if (!providerResponse.success) {
        await adminSupabase
            .from('orders')
            .update({ status: 'failed', metadata: { ...metadata, error: providerResponse.error } })
            .eq('id', order.id);
        throw new Error(providerResponse.error || 'Failed to create provider order');
    }

    // Update order with provider order ID and metadata
    await adminSupabase
        .from('orders')
        .update({
            provider_order_id: providerResponse.providerOrderId,
            metadata: { ...metadata, ...providerResponse.metadata }
        })
        .eq('id', order.id);

    return {
        order: { ...order, provider_order_id: providerResponse.providerOrderId },
        redirectUrl: providerResponse.redirectUrl,
        providerOrderId: providerResponse.providerOrderId,
        metadata: providerResponse?.metadata
    };
}

export async function capturePaymentOrder(params: CapturePaymentParams) {
    const {
        orderId,
        providerOrderId,
        userId,
        type,
        productId,
        amountCents,
        provider: providerName
    } = params;

    const adminSupabase = await createAdminClient();
    const provider = getProvider(providerName);

    console.log(`Capturing payment for order ${orderId} (Provider: ${providerName}, ProviderOrderId: ${providerOrderId})`);
    const captureResult = await provider.captureOrder(providerOrderId);
    console.log(`Capture result for order ${orderId}:`, captureResult);

    if (!captureResult.success) {
        await adminSupabase
            .from('orders')
            .update({
                status: captureResult.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        throw new Error(`Payment not completed: ${captureResult.status}`);
    }

    let licenses: any[] = [];

    if (type === 'credits') {
        await processCreditsPayment(adminSupabase, userId, productId, amountCents);
    } else if (type === 'subscription') {
        await processSubscriptionPayment(adminSupabase, userId, productId, amountCents);
    } else if (type === 'license' || (productId && await isLicenseProduct(adminSupabase, productId))) {
        const license = await processLicensePayment(adminSupabase, userId, productId);
        if (license) licenses.push(license);
    } else if (type === 'product') {
        await processProductPayment(adminSupabase, orderId);
    }

    const { data: order, error } = await adminSupabase
        .from('orders')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error('Error updating order:', error);
        throw new Error('Failed to update order');
    }

    return { order, captureResult, licenses };
}

async function processCreditsPayment(adminSupabase: any, userId: string, productId: string, amountCents: number) {
    const { data: product, error: productError } = await adminSupabase
        .from('credit_products')
        .select('credits_amount')
        .eq('id', productId)
        .single();

    if (productError || !product) {
        throw new Error('Product not found');
    }

    const { data: currentCredits, error: fetchError } = await adminSupabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

    if (fetchError) {
        console.error('Fetch credits error:', fetchError);
        throw new Error('Failed to retrieve user credit balance');
    }

    const currentBalance = currentCredits?.balance || 0;

    const { data: updatedCredits, error: updateError } = await adminSupabase
        .from('user_credits')
        .update({
            balance: currentBalance + product.credits_amount,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

    if (updateError) {
        console.error('Credits update error:', updateError);
        throw updateError;
    }

    return updatedCredits;
}

async function processSubscriptionPayment(adminSupabase: any, userId: string, planId: string, amountCents: number) {
    const { data: targetPlan, error: planError } = await adminSupabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

    if (planError || !targetPlan) {
        throw new Error('Plan not found');
    }

    if (targetPlan.price_cents !== amountCents) {
        throw new Error('Amount mismatch');
    }

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { data: subscription, error: subError } = await adminSupabase
        .from('subscriptions')
        .upsert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

    if (subError) {
        console.error('Subscription update error:', subError);
        throw subError;
    }

    return subscription;
}

async function isLicenseProduct(adminSupabase: any, productId: string) {
    const { data } = await adminSupabase
        .from('credit_products')
        .select('type')
        .eq('id', productId)
        .single();
    return data?.type === 'license';
}

async function processLicensePayment(adminSupabase: any, userId: string, productId: string) {
    const { data: product, error: productError } = await adminSupabase
        .from('credit_products')
        .select('duration_days, name')
        .eq('id', productId)
        .single();

    if (productError || !product) {
        throw new Error('License product not found');
    }

    // Generate a unique license key: XXXX-XXXX-XXXX-XXXX
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateSegment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const key = `${generateSegment()}-${generateSegment()}-${generateSegment()}-${generateSegment()}`;

    let expiresAt = null;
    if (product.duration_days > 0) {
        const date = new Date();
        date.setDate(date.getDate() + product.duration_days);
        expiresAt = date.toISOString();
    }

    const { data: license, error: licenseError } = await adminSupabase
        .from('license_keys')
        .insert({
            user_id: userId,
            product_id: productId,
            key_value: key,
            expires_at: expiresAt,
            status: 'active'
        })
        .select()
        .single();

    if (licenseError) {
        console.error('License key generation error:', licenseError);
        throw new Error('Failed to generate license key');
    }

    // TODO: Trigger email notification here if service is available
    console.log(`Generated license key for user ${userId}: ${key}`);

    return license;
}

async function processProductPayment(adminSupabase: any, orderId: string) {
    // Fetch order items to know what to deduct
    const { data: items, error: itemsError } = await adminSupabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

    if (itemsError || !items) {
        console.error('Error fetching order items for stock deduction:', itemsError);
        return; // Or throw error if critical
    }

    // Deduct stock for each item
    for (const item of items) {
        if (!item.product_id) continue;

        const { error: rpcError } = await adminSupabase.rpc('decrement_product_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity
        });

        if (rpcError) {
            console.error(`Error calling decrement_product_stock for product ${item.product_id}:`, rpcError);

            // Fallback to manual update if RPC fails (e.g. not yet deployed)
            const { data: product } = await adminSupabase
                .from('products')
                .select('stock_quantity')
                .eq('id', item.product_id)
                .single();

            if (product) {
                await adminSupabase
                    .from('products')
                    .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
                    .eq('id', item.product_id);
            }
        }
    }
}

export async function getUserOrders(userId: string, options?: { type?: PaymentType; limit?: number; offset?: number }) {
    const adminSupabase = await createAdminClient();
    const { type, limit = 20, offset = 0 } = options || {};

    let query = adminSupabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (type) {
        query = query.eq('type', type);
    }

    const { data: orders, error } = await query;

    if (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Failed to fetch orders');
    }

    return orders;
}
