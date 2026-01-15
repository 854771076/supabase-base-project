'use client';

import React from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from '@/i18n/context';

export default function PaymentCancelPage() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Checkout');

    return (
        <div style={{ padding: '80px 24px' }}>
            <Result
                status="warning"
                title="Payment Cancelled"
                subTitle="You have cancelled the payment process."
                extra={[
                    <Button type="primary" key="checkout" onClick={() => router.push(`/${locale}/checkout`)}>
                        Return to Checkout
                    </Button>,
                    <Button key="home" onClick={() => router.push(`/${locale}`)}>
                        {t('backHome')}
                    </Button>,
                ]}
            />
        </div>
    );
}
