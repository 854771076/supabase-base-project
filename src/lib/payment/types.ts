import { PaymentStatus, PaymentType } from '../payment';

export interface PaymentOrder {
    id: string;
    userId: string;
    amountCents: number;
    currency: string;
    status: PaymentStatus;
    type: PaymentType;
    items: any[];
    metadata?: Record<string, any>;
}

export interface PaymentProviderResponse {
    success: boolean;
    providerOrderId?: string;
    redirectUrl?: string;
    error?: string;
}

export interface PaymentProvider {
    name: string;
    createOrder(order: PaymentOrder): Promise<PaymentProviderResponse>;
    captureOrder(providerOrderId: string): Promise<{ success: boolean; status: string }>;
}
