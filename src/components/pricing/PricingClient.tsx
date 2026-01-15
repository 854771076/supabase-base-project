'use client';

import React, { useState } from 'react';
import { Card, Button, Row, Col, Typography, List, App, Tag, Space } from 'antd';
import { CheckOutlined, ShoppingCartOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import { useCart } from '../cart/CartContext';

const { Title, Text } = Typography;

interface PricingClientProps {
    plans: any[];
    currentSubscription: any;
    locale: string;
}

export default function PricingClient({ plans, currentSubscription, locale }: PricingClientProps) {
    const t = useTranslations('Pricing');
    const tCart = useTranslations('Cart');
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const { addItem } = useCart();

    const handleFreeSubscribe = async (planId: string) => {
        setLoading(planId);
        try {
            const response = await fetch('/api/v1/subscription/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to subscribe');
            }

            message.success(t('subscribeSuccess'));
            router.refresh();
            router.push(`/${locale}/profile`);
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(null);
        }
    };

    const handleAddToCart = (plan: any) => {
        addItem({
            id: plan.id,
            name: plan.name,
            price_cents: plan.price_cents,
            type: 'subscription',
        });
        message.success(tCart('addedToCart'));
    };

    const handleBuyNow = (plan: any) => {
        addItem({
            id: plan.id,
            name: plan.name,
            price_cents: plan.price_cents,
            type: 'subscription',
        });
        router.push(`/${locale}/checkout`);
    };

    return (
        <div className="pricing-container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <Title level={1}>{t('title')}</Title>
                <Text type="secondary" style={{ fontSize: '18px' }}>{t('subtitle')}</Text>
            </div>

            <Row gutter={[24, 24]} justify="center">
                {plans.map((plan) => {
                    const isCurrent = currentSubscription?.plan_id === plan.id;
                    const isPaid = plan.price_cents > 0;

                    const features = Object.entries(plan.features).map(([key, val]) => ({
                        key,
                        label: key,
                        enabled: !!val
                    }));
                    const quotas = Object.entries(plan.quotas).map(([key, val]) => ({
                        key,
                        label: key,
                        value: val
                    }));

                    return (
                        <Col xs={24} sm={18} md={10} lg={8} xl={7} key={plan.id}>
                            <Card
                                hoverable
                                styles={{ body: { padding: '32px 24px', flex: 1, display: 'flex', flexDirection: 'column' } }}
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: '16px',
                                    border: isCurrent ? '2px solid #1677ff' : undefined,
                                    boxShadow: isCurrent ? '0 8px 24px rgba(22,119,255,0.15)' : '0 4px 12px rgba(0,0,0,0.05)'
                                }}
                                title={
                                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                        <Title level={3} style={{ marginBottom: 0 }}>{plan.name}</Title>
                                        {isCurrent && <Tag color="blue" style={{ marginTop: '8px' }}>{t('currentPlan')}</Tag>}
                                    </div>
                                }
                            >
                                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                    <Text style={{ fontSize: '32px', fontWeight: 'bold' }}>
                                        ${(plan.price_cents / 100).toFixed(2)}
                                    </Text>
                                    <Text type="secondary"> / {t('month')}</Text>
                                </div>

                                <Text strong style={{ display: 'block', marginBottom: '12px' }}>{t('featuresIncluded')}</Text>
                                <List
                                    size="small"
                                    dataSource={[...features, ...quotas]}
                                    renderItem={(item: any) => (
                                        <List.Item style={{ border: 'none', padding: '4px 0' }}>
                                            <Space>
                                                <CheckOutlined style={{ color: '#52c41a' }} />
                                                <Text>
                                                    {item.value ? `${item.label}: ${item.value}` : item.label}
                                                </Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                    style={{ flex: 1, marginBottom: '24px' }}
                                />

                                {isCurrent ? (
                                    <Button
                                        type="default"
                                        size="large"
                                        block
                                        disabled
                                        style={{ borderRadius: '8px', height: '48px' }}
                                    >
                                        {t('alreadySubscribed')}
                                    </Button>
                                ) : isPaid ? (
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Button
                                            type="primary"
                                            size="large"
                                            block
                                            icon={<CreditCardOutlined />}
                                            onClick={() => handleBuyNow(plan)}
                                            style={{ borderRadius: '8px', height: '48px' }}
                                        >
                                            {t('getStarted')}
                                        </Button>
                                        <Button
                                            type="default"
                                            size="large"
                                            block
                                            icon={<ShoppingCartOutlined />}
                                            onClick={() => handleAddToCart(plan)}
                                            style={{ borderRadius: '8px', height: '48px' }}
                                        >
                                            {tCart('addedToCart')}
                                        </Button>
                                    </Space>
                                ) : (
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        loading={loading === plan.id}
                                        disabled={currentSubscription?.plans?.price_cents > 0}
                                        onClick={() => handleFreeSubscribe(plan.id)}
                                        style={{ borderRadius: '8px', height: '48px' }}
                                    >
                                        {currentSubscription?.plans?.price_cents > 0 ? t('alreadySubscribed') : t('getStarted')}
                                    </Button>
                                )}
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
}

