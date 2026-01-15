'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Radio, Space, List, Divider, App, Result, Select, QRCode, Descriptions, Modal, Image, Tag } from 'antd';
import { CreditCardOutlined, WalletOutlined, CheckCircleOutlined, InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useCart } from '@/components/cart/CartContext';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import { TOKENPAY_CURRENCIES, DEFAULT_TOKENPAY_CURRENCY } from '@/lib/payment/providers/tokenpay.config';
import TokenPayModal from '@/components/payment/TokenPayModal';

const { Title, Text, Paragraph } = Typography;

export default function CheckoutClient() {
    const { items, totalAmount, clearCart } = useCart();
    const t = useTranslations('Checkout');
    const tCart = useTranslations('Cart');
    const locale = useLocale();
    const router = useRouter();
    const { message } = App.useApp();

    const [paymentMethod, setPaymentMethod] = useState('paypal');
    const [tokenPayCurrency, setTokenPayCurrency] = useState(DEFAULT_TOKENPAY_CURRENCY);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderInfo, setOrderInfo] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);


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
                    currency: paymentMethod === 'tokenpay' ? tokenPayCurrency : 'USD',
                }),
            });

            const result = await response.json();

            if (result.success) {
                if (result.redirectUrl && paymentMethod !== 'tokenpay') {
                    window.location.href = result.redirectUrl;
                } else if (paymentMethod === 'tokenpay') {
                    setOrderInfo(result);
                    setIsModalVisible(true);
                    clearCart();
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
            <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
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
            </div>
        );
    }

    if (items.length === 0 && !success && !isModalVisible) {
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
                                <Radio value="paypal" style={{ width: '100%', padding: '16px', border: '1px solid #f0f0f0', borderRadius: '12px', marginBottom: '8px' }}>
                                    <Space>
                                        <CreditCardOutlined style={{ fontSize: '20px', color: '#003087' }} />
                                        <Text strong>PayPal</Text>
                                    </Space>
                                </Radio>
                                <Radio value="tokenpay" style={{ width: '100%', padding: '16px', border: '1px solid #f0f0f0', borderRadius: '12px' }}>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Space>
                                            <WalletOutlined style={{ fontSize: '20px', color: '#1677ff' }} />
                                            <Text strong>TokenPay (Crypto)</Text>
                                        </Space>
                                        {paymentMethod === 'tokenpay' && (
                                            <div
                                                style={{ marginTop: '16px', paddingLeft: '28px' }}
                                            >
                                                <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>{t('selectCurrency')}</Text>
                                                <Row gutter={[12, 12]}>
                                                    {TOKENPAY_CURRENCIES.map((c) => (
                                                        <Col xs={12} sm={8} key={c.value}>
                                                            <Card
                                                                hoverable
                                                                size="small"
                                                                onClick={() => setTokenPayCurrency(c.value)}
                                                                styles={{
                                                                    body: {
                                                                        padding: '12px',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        border: tokenPayCurrency === c.value ? '2px solid #1677ff' : '1px solid #f0f0f0',
                                                                        borderRadius: '8px',
                                                                        background: tokenPayCurrency === c.value ? '#e6f4ff' : '#fff',
                                                                        transition: 'all 0.3s'
                                                                    }
                                                                }}
                                                            >
                                                                <Image src={c.icon} width={32} height={32} preview={false} alt={c.label} />
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <Text strong style={{ fontSize: '14px', display: 'block' }}>{c.label}</Text>
                                                                    <Tag color="default" style={{ margin: 0, fontSize: '10px' }}>{c.network}</Tag>
                                                                </div>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </div>
                                        )}
                                    </Space>
                                </Radio>
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
                            style={{ height: '54px', borderRadius: '12px', marginTop: '16px' }}
                        >
                            {t('payNow')}
                        </Button>
                    </Card>
                </Col>
            </Row>
            <TokenPayModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                orderId={orderInfo?.orderId}
                metadata={orderInfo?.metadata}
                onSuccess={() => {
                    setIsModalVisible(false);
                    setSuccess(true);
                }}
            />
        </div>
    );
}
