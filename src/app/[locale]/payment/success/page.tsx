'use client';

import React, { useEffect, useState } from 'react';
import { Result, Button, Spin } from 'antd';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from '@/i18n/context';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Checkout');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'success' | 'error' | 'processing'>('processing');

    const orderId = searchParams.get('order_id');

    useEffect(() => {
        if (orderId) {
            // Optionally verify order status here
            setLoading(false);
            setStatus('success');
        }
    }, [orderId]);

    if (loading) {
        return (
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '80px 24px' }}>
            <Result
                status={status === 'success' ? 'success' : 'error'}
                title={status === 'success' ? t('successTitle') : 'Payment Failed'}
                subTitle={status === 'success' ? t('successSubtitle') : 'There was an error processing your payment.'}
                extra={[
                    <Button type="primary" key="home" onClick={() => router.push(`/${locale}`)}>
                        {t('backHome')}
                    </Button>,
                    <Button key="orders" onClick={() => router.push(`/${locale}/profile`)}>
                        {t('viewOrders')}
                    </Button>,
                ]}
            />
        </div>
    );
}
