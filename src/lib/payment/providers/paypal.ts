import { createPayPalOrder, capturePayPalOrder } from '../../paypal';
import { PaymentProvider, PaymentOrder, PaymentProviderResponse } from '../types';

export class PayPalProvider implements PaymentProvider {
    name = 'paypal';

    async createOrder(order: PaymentOrder): Promise<PaymentProviderResponse> {
        try {
            const amount = (order.amountCents / 100).toFixed(2);
            const returnUrl = order.metadata?.return_url;
            const cancelUrl = order.metadata?.cancel_url;
            const paypalOrder = await createPayPalOrder(amount, order.currency, returnUrl, cancelUrl);

            const approveUrl = paypalOrder.links?.find((l: any) => l.rel === 'approve')?.href;

            return {
                success: true,
                providerOrderId: paypalOrder.id,
                redirectUrl: approveUrl,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async captureOrder(providerOrderId: string): Promise<{ success: boolean; status: string }> {
        try {
            const captureData = await capturePayPalOrder(providerOrderId);
            return {
                success: captureData.status === 'COMPLETED',
                status: captureData.status,
            };
        } catch (error) {
            return {
                success: false,
                status: 'FAILED',
            };
        }
    }
}
