import { env } from '@/utils/env';

/**
 * Generate an access token from PayPal
 */
async function generateAccessToken() {
    const { NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_API_BASE } = env;

    if (!NEXT_PUBLIC_PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        throw new Error('PayPal credentials missing');
    }

    const auth = Buffer.from(NEXT_PUBLIC_PAYPAL_CLIENT_ID + ':' + PAYPAL_SECRET).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
        },
    });

    const data = await response.json();
    return data.access_token;
}

/**
 * Create a PayPal order
 */
export async function createPayPalOrder(amount: string, currencyCode: string = 'USD') {
    const accessToken = await generateAccessToken();
    const url = `${env.PAYPAL_API_BASE}/v2/checkout/orders`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: currencyCode,
                        value: amount,
                    },
                },
            ],
        }),
    });

    return handleResponse(response);
}

/**
 * Capture a PayPal order
 */
export async function capturePayPalOrder(orderId: string) {
    const accessToken = await generateAccessToken();
    const url = `${env.PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return handleResponse(response);
}

async function handleResponse(response: Response) {
    if (response.status === 200 || response.status === 201) {
        return response.json();
    }

    const errorMessage = await response.text();
    throw new Error(errorMessage);
}
