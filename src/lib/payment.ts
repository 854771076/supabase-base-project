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

    // Create order with provider
    const providerResponse = await provider.createOrder({
        id: order.id,
        userId,
        amountCents,
        currency,
        status: 'pending',
        type,
        items,
        metadata
    });

    if (!providerResponse.success) {
        await adminSupabase
            .from('orders')
            .update({ status: 'failed', metadata: { ...metadata, error: providerResponse.error } })
            .eq('id', order.id);
        throw new Error(providerResponse.error || 'Failed to create provider order');
    }

    // Update order with provider order ID
    await adminSupabase
        .from('orders')
        .update({ provider_order_id: providerResponse.providerOrderId })
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

    const captureResult = await provider.captureOrder(providerOrderId);

    if (!captureResult.success) {
        await adminSupabase
            .from('orders')
            .update({
                status: 'failed',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        throw new Error(`Payment not completed: ${captureResult.status}`);
    }

    if (type === 'credits') {
        await processCreditsPayment(adminSupabase, userId, productId, amountCents);
    } else if (type === 'subscription') {
        await processSubscriptionPayment(adminSupabase, userId, productId, amountCents);
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

    return { order, captureResult };
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
