'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Radio, Space, List, Divider, App, Result, Select, QRCode, Descriptions } from 'antd';
import { CreditCardOutlined, WalletOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useCart } from '@/components/cart/CartContext';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import { TOKENPAY_CURRENCIES, DEFAULT_TOKENPAY_CURRENCY } from '@/lib/payment/providers/tokenpay.config';

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
                } else {
                    setOrderInfo(result);
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
        const tpInfo = orderInfo?.metadata;

        return (
            <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
                <Result
                    status="success"
                    title={t('successTitle')}
                    subTitle={paymentMethod === 'tokenpay' ? t('tokenPayInstructions') : t('successSubtitle')}
                />

                {paymentMethod === 'tokenpay' && tpInfo && (
                    <Card title={t('paymentInfo')} style={{ marginTop: '24px', borderRadius: '12px' }}>
                        <Row gutter={32} align="middle">
                            <Col xs={24} md={8} style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <Space direction="vertical" align="center">
                                    <QRCode value={tpInfo.QrCodeLink || tpInfo.ToAddress} size={200} />
                                    <Text type="secondary">{t('scanToPay')}</Text>
                                </Space>
                            </Col>
                            <Col xs={24} md={16}>
                                <Descriptions column={1} bordered size="small">
                                    <Descriptions.Item label={t('amount')}>
                                        <Text strong style={{ fontSize: '18px', color: '#1677ff' }}>
                                            {tpInfo.Amount} {tpInfo.CurrencyName}
                                        </Text>
                                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                            ≈ {tpInfo.ActualAmount} {tpInfo.BaseCurrency}
                                        </div>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('network')}>
                                        <Text strong>{tpInfo.BlockChainName}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('address')}>
                                        <Text copyable code style={{ fontSize: '12px' }}>{tpInfo.ToAddress}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('orderId')}>
                                        <Text type="secondary">{tpInfo.Id}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('expires')}>
                                        <Text type="danger">{tpInfo.ExpireTime}</Text>
                                    </Descriptions.Item>
                                </Descriptions>
                                <div style={{ marginTop: '16px', padding: '12px', background: '#fff7e6', border: '1px solid #ffe7ba', borderRadius: '8px' }}>
                                    <Space align="start">
                                        <InfoCircleOutlined style={{ color: '#faad14', marginTop: '4px' }} />
                                        <Text type="warning" style={{ fontSize: '12px' }}>
                                            {t('tokenPayWarning')}
                                        </Text>
                                    </Space>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                )}

                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <Space size="middle">
                        <Button type="primary" size="large" onClick={() => router.push(`/${locale}`)}>
                            {t('backHome')}
                        </Button>
                        <Button size="large" onClick={() => router.push(`/${locale}/orders`)}>
                            {t('viewOrders')}
                        </Button>
                    </Space>
                </div>
            </div>
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
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Space>
                                            <WalletOutlined />
                                            <span>TokenPay (Crypto)</span>
                                        </Space>
                                        {paymentMethod === 'tokenpay' && (
                                            <div style={{ marginTop: '12px', paddingLeft: '24px' }}>
                                                <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>{t('selectCurrency')}</Text>
                                                <Select
                                                    value={tokenPayCurrency}
                                                    onChange={setTokenPayCurrency}
                                                    style={{ width: '100%' }}
                                                    options={TOKENPAY_CURRENCIES}
                                                />
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
