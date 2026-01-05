import { createPayPalOrder, capturePayPalOrder } from './paypal';
import { createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

export const paymentTypeSchema = z.enum(['subscription', 'credits']);
export const paymentStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']);

export type PaymentType = z.infer<typeof paymentTypeSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

interface CreatePaymentParams {
    userId: string;
    type: PaymentType;
    productId: string;
    productType: string;
    productName: string;
    amountCents: number;
    currency?: string;
    metadata?: Record<string, any>;
}

interface CapturePaymentParams {
    orderId: string;
    providerOrderId: string;
    userId: string;
    type: PaymentType;
    productId: string;
    amountCents: number;
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
        metadata = {}
    } = params;

    const adminSupabase = await createAdminClient();

    const amount = (amountCents / 100).toFixed(2);
    const paypalOrder = await createPayPalOrder(amount, currency);

    const { data: order, error } = await adminSupabase
        .from('orders')
        .insert({
            user_id: userId,
            type,
            provider: 'paypal',
            provider_order_id: paypalOrder.id,
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

    return {
        order,
        paypalOrder: {
            id: paypalOrder.id,
            status: paypalOrder.status,
            approveUrl: paypalOrder.links?.find((l: any) => l.rel === 'approve')?.href
        }
    };
}

export async function capturePaymentOrder(params: CapturePaymentParams) {
    const {
        orderId,
        providerOrderId,
        userId,
        type,
        productId,
        amountCents
    } = params;

    const adminSupabase = await createAdminClient();
    const captureData = await capturePayPalOrder(providerOrderId);

    if (captureData.status !== 'COMPLETED') {
        await adminSupabase
            .from('orders')
            .update({
                status: 'failed',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        throw new Error('Payment not completed');
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

    return { order, captureData };
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
