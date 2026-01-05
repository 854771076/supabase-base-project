'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Space, Statistic, message } from 'antd';
import { ShoppingCartOutlined, WalletOutlined } from '@ant-design/icons';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

interface CreditProduct {
    id: string;
    name: string;
    credits_amount: number;
    price_cents: number;
}

interface CreditsStoreClientProps {
    products: CreditProduct[];
    initialBalance: number;
    translations: {
        title: string;
        subtitle: string;
        balance: string;
        buyNow: string;
        success: string;
        error: string;
    };
}

export default function CreditsStoreClient({
    products,
    initialBalance,
    translations: t
}: CreditsStoreClientProps) {
    const [balance, setBalance] = useState(initialBalance);
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

    const handleCapture = async (orderId: string, productId: string) => {
        setLoading(productId);
        try {
            const response = await fetch('/api/v1/payments/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, providerOrderId: orderId }),
            });

            const result = await response.json();
            if (result.success) {
                message.success(t.success);
                const found = products.find(p => p.id === productId);
                if (found) {
                    setBalance(prev => prev + found.credits_amount);
                } else {
                    console.warn('未找到对应产品，积分未增加');
                }
                router.refresh();
            } else {
                message.error(result.error || t.error);
            }
        } catch (error) {
            console.error('Capture error:', error);
            message.error(t.error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <PayPalScriptProvider options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
            currency: "USD",
            intent: "capture"
        }}>
            <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Title level={2}>{t.title}</Title>
                    <Paragraph type="secondary" style={{ fontSize: '16px' }}>
                        {t.subtitle}
                    </Paragraph>

                    <Card style={{ maxWidth: '300px', margin: '24px auto', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic
                            title={t.balance}
                            value={balance}
                            prefix={<WalletOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </div>

                <Row gutter={[24, 24]} justify="center">
                    {products.map((product) => (
                        <Col xs={24} sm={12} lg={8} key={product.id}>
                            <Card
                                hoverable
                                title={
                                    <Space>
                                        <ShoppingCartOutlined />
                                        <span>{product.name}</span>
                                    </Space>
                                }
                                style={{ borderRadius: '12px', textAlign: 'center' }}
                            >
                                <Title level={3} style={{ margin: '12px 0' }}>
                                    ${(product.price_cents / 100).toFixed(2)}
                                </Title>
                                <Paragraph>
                                    <Text strong style={{ fontSize: '18px' }}>
                                        {product.credits_amount}
                                    </Text>
                                    <Text type="secondary"> Credits</Text>
                                </Paragraph>

                                <div style={{ marginTop: '24px' }}>
                                    <PayPalButtons
                                        style={{ layout: "vertical", shape: "rect", label: "buynow" }}
                                        createOrder={async () => {
                                            const response = await fetch('/api/v1/payments/create-order', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ type: 'credits', productId: product.id }),
                                            });
                                            const { paypalOrder } = await response.json();
                                            return paypalOrder.id;
                                        }}
                                        onApprove={async (data) => {
                                            await handleCapture(data.orderID, product.id);
                                        }}
                                        onError={(err) => {
                                            console.error('PayPal Credits Error:', err);
                                            message.error(t.error);
                                        }}
                                    />
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </PayPalScriptProvider>
    );
}
