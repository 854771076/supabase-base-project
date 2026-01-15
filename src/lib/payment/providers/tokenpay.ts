import { env } from '@/utils/env';
import { PaymentProvider, PaymentOrder, PaymentProviderResponse } from '../types';

export class TokenPayProvider implements PaymentProvider {
    name = 'tokenpay';

    async createOrder(order: PaymentOrder): Promise<PaymentProviderResponse> {
        const { NEXT_PUBLIC_TOKENPAY_URL, TOKENPAY_API_KEY } = env;

        if (!NEXT_PUBLIC_TOKENPAY_URL || !TOKENPAY_API_KEY) {
            return {
                success: false,
                error: 'TokenPay configuration missing',
            };
        }

        try {
            // TokenPay API implementation (Assuming standard TokenPay REST API)
            const response = await fetch(`${NEXT_PUBLIC_TOKENPAY_URL}/api/v1/order/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': TOKENPAY_API_KEY,
                },
                body: JSON.stringify({
                    amount: (order.amountCents / 100).toFixed(2),
                    currency: order.currency,
                    order_id: order.id,
                    title: `Order #${order.id.slice(0, 8)}`,
                    description: order.items.map(i => i.name).join(', '),
                    success_url: `${window.location.origin}/payment/success?order_id=${order.id}`,
                    cancel_url: `${window.location.origin}/payment/cancel?order_id=${order.id}`,
                }),
            });

            const data = await response.json();

            if (data.code === 200) {
                return {
                    success: true,
                    providerOrderId: data.data.order_id,
                    redirectUrl: data.data.payment_url,
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
        // TokenPay usually uses webhooks for confirmation, but we can implement a check if needed
        const { NEXT_PUBLIC_TOKENPAY_URL, TOKENPAY_API_KEY } = env;

        try {
            const response = await fetch(`${NEXT_PUBLIC_TOKENPAY_URL}/api/v1/order/check?order_id=${providerOrderId}`, {
                headers: {
                    'x-api-key': TOKENPAY_API_KEY!,
                },
            });
            const data = await response.json();

            return {
                success: data.data?.status === 'completed',
                status: data.data?.status || 'unknown',
            };
        } catch (error) {
            return {
                success: false,
                status: 'error',
            };
        }
    }
}
