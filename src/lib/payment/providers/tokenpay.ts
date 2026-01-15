import { env } from '@/utils/env';
import { PaymentProvider, PaymentOrder, PaymentProviderResponse } from '../types';
import crypto from 'crypto';

export class TokenPayProvider implements PaymentProvider {
    name = 'tokenpay';

    private generateSignature(params: Record<string, any>, secret: string): string {
        const sortedKeys = Object.keys(params)
            .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
            .sort();

        const queryString = sortedKeys
            .map(key => `${key}=${params[key]}`)
            .join('&');

        return crypto.createHash('md5').update(queryString + secret).digest('hex');
    }

    async createOrder(order: PaymentOrder): Promise<PaymentProviderResponse> {
        const { NEXT_PUBLIC_TOKENPAY_URL, TOKENPAY_API_KEY } = env;

        if (!NEXT_PUBLIC_TOKENPAY_URL || !TOKENPAY_API_KEY) {
            return {
                success: false,
                error: 'TokenPay configuration missing',
            };
        }

        const baseUrl = NEXT_PUBLIC_TOKENPAY_URL.replace(/\/$/, '');

        try {
            const payload: Record<string, any> = {
                OutOrderId: order.id,
                OrderUserKey: order.userId,
                ActualAmount: Number((order.amountCents / 100).toFixed(2)),
                Currency: order.currency,
                RedirectUrl: order.metadata?.redirect_url || `${process.env.NEXT_PUBLIC_APP_URL || ''}/payment/callback?order_id=${order.id}`,
            };

            // Add optional fields if available
            if (order.metadata?.notify_url) {
                payload.NotifyUrl = order.metadata.notify_url;
            }

            const signature = this.generateSignature(payload, TOKENPAY_API_KEY);
            payload.Signature = signature;

            const response = await fetch(`${baseUrl}/CreateOrder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    providerOrderId: data.info?.Id || order.id,
                    redirectUrl: data.data,
                    metadata: data.info,
                };
            }

            return {
                success: false,
                error: data.message || 'Failed to create TokenPay order',
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async captureOrder(providerOrderId: string): Promise<{ success: boolean; status: string }> {
        const { NEXT_PUBLIC_TOKENPAY_URL, TOKENPAY_API_KEY } = env;

        if (!NEXT_PUBLIC_TOKENPAY_URL || !TOKENPAY_API_KEY) {
            return { success: false, status: 'failed' };
        }

        const baseUrl = NEXT_PUBLIC_TOKENPAY_URL.replace(/\/$/, '');

        try {
            const params = { Id: providerOrderId };
            const signature = this.generateSignature(params, TOKENPAY_API_KEY);

            const response = await fetch(`${baseUrl}/Query?Id=${providerOrderId}&Signature=${signature}`);
            const data = await response.json();

            // Based on docs, status 1 is paid
            return {
                success: data.success && data.data?.status === 'Paid',
                status: data.data?.status === 'Paid' ? 'completed' : (data.data?.status === 'Pending' ? 'pending' : 'failed'),
            };
        } catch (error) {
            return {
                success: false,
                status: 'failed',
            };
        }
    }
}
