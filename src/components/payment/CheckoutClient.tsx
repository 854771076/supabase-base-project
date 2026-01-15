'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Radio, Space, List, Divider, App, Result } from 'antd';
import { CreditCardOutlined, WalletOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useCart } from '@/components/cart/CartContext';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

export default function CheckoutClient() {
    const { items, totalAmount, clearCart } = useCart();
    const t = useTranslations('Checkout');
    const tCart = useTranslations('Cart');
    const locale = useLocale();
    const router = useRouter();
    const { message } = App.useApp();

    const [paymentMethod, setPaymentMethod] = useState('paypal');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePayment = async () => {
        if (items.length === 0) return;

        setLoading(true);
        try {
            const response = await fetch('/api/v1/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    paymentMethod,
                }),
            });

            const result = await response.json();

            if (result.success) {
                if (result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                } else {
                    setSuccess(true);
                    clearCart();
                }
            } else {
                message.error(result.error || 'Payment failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            message.error('An error occurred during payment');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Result
                status="success"
                title={t('successTitle')}
                subTitle={t('successSubtitle')}
                extra={[
                    <Button type="primary" key="home" onClick={() => router.push(`/${locale}`)}>
                        {t('backHome')}
                    </Button>,
                    <Button key="orders" onClick={() => router.push(`/${locale}/orders`)}>
                        {t('viewOrders')}
                    </Button>,
                ]}
            />
        );
    }

    if (items.length === 0) {
        return (
            <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                <Title level={2}>{tCart('emptyCart')}</Title>
                <Button type="primary" size="large" onClick={() => router.push(`/${locale}/pricing`)}>
                    {t('goShopping')}
                </Button>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2} style={{ marginBottom: '32px' }}>{t('title')}</Title>

            <Row gutter={32}>
                <Col xs={24} lg={16}>
                    <Card title={t('orderSummary')} style={{ marginBottom: '24px', borderRadius: '12px' }}>
                        <List
                            itemLayout="horizontal"
                            dataSource={items}
                            renderItem={(item) => (
                                <List.Item
                                    extra={<Text strong>${((item.price_cents * item.quantity) / 100).toFixed(2)}</Text>}
                                >
                                    <List.Item.Meta
                                        title={item.name}
                                        description={`${item.quantity} x $${(item.price_cents / 100).toFixed(2)}`}
                                    />
                                </List.Item>
                            )}
                        />
                        <Divider />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ fontSize: '18px' }}>{t('total')}</Text>
                            <Text strong style={{ fontSize: '24px', color: '#1677ff' }}>
                                ${(totalAmount / 100).toFixed(2)}
                            </Text>
                        </div>
                    </Card>

                    <Card title={t('paymentMethod')} style={{ borderRadius: '12px' }}>
                        <Radio.Group
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            value={paymentMethod}
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Radio value="paypal" style={{ width: '100%', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px', marginBottom: '8px' }}>
                                    <Space>
                                        <CreditCardOutlined />
                                        <span>PayPal</span>
                                    </Space>
                                </Radio>
                                <Radio value="tokenpay" style={{ width: '100%', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                                    <Space>
                                        <WalletOutlined />
                                        <span>TokenPay (Crypto)</span>
                                    </Space>
                                </Radio>
                                {/* Add more payment methods here easily */}
                            </Space>
                        </Radio.Group>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card style={{ borderRadius: '12px', position: 'sticky', top: '100px' }}>
                        <Title level={4}>{t('checkout')}</Title>
                        <Paragraph type="secondary">
                            {t('disclaimer')}
                        </Paragraph>
                        <Button
                            type="primary"
                            size="large"
                            block
                            loading={loading}
                            onClick={handlePayment}
                            style={{ height: '54px', borderRadius: '8px', marginTop: '16px' }}
                        >
                            {t('payNow')}
                        </Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
