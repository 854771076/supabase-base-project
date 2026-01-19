'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Space, Statistic, App, Tag } from 'antd';
import { ShoppingCartOutlined, WalletOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from '@/i18n/context';
import { useCart } from '../cart/CartContext';

const { Title, Text, Paragraph } = Typography;

interface CreditProduct {
    id: string;
    name: string;
    credits_amount: number;
    price_cents: number;
    type: 'credits' | 'license';
    duration_days: number;
}

interface CreditsStoreClientProps {
    products: CreditProduct[];
    initialBalance: number;
}

export default function CreditsStoreClient({
    products,
    initialBalance
}: CreditsStoreClientProps) {
    const t = useTranslations('Credits');
    const tCart = useTranslations('Cart');
    const { message } = App.useApp();

    const [balance, setBalance] = useState(initialBalance);
    const router = useRouter();
    const { addItem } = useCart();

    const currentLocale = useLocale();

    const handleAddToCart = (product: CreditProduct) => {
        addItem({
            id: product.id,
            name: product.name,
            price_cents: product.price_cents,
            type: product.type as any,
        });
        message.success(tCart('addedToCart'));
    };

    const handleBuyNow = (product: CreditProduct) => {
        addItem({
            id: product.id,
            name: product.name,
            price_cents: product.price_cents,
            type: product.type as any,
        });
        router.push(`/${currentLocale}/checkout`);
    };

    return (
        <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <Title level={2}>{t('title')}</Title>
                <Paragraph type="secondary" style={{ fontSize: '16px' }}>
                    {t('subtitle')}
                </Paragraph>

                <Card style={{ maxWidth: '300px', margin: '24px auto', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Statistic
                        title={t('balance')}
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
                                    {product.type === 'credits' ? <WalletOutlined /> : <CreditCardOutlined />}
                                    <span>{product.name}</span>
                                </Space>
                            }
                            style={{
                                borderRadius: '12px',
                                textAlign: 'center',
                                border: product.type === 'license' ? '1px solid #e6f7ff' : undefined,
                                background: product.type === 'license' ? '#fafcfe' : undefined
                            }}
                        >
                            <Title level={3} style={{ margin: '12px 0' }}>
                                ${(product.price_cents / 100).toFixed(2)}
                            </Title>

                            {product.type === 'credits' ? (
                                <Paragraph>
                                    <Text strong style={{ fontSize: '18px' }}>
                                        {product.credits_amount}
                                    </Text>
                                    <Text type="secondary"> Credits</Text>
                                </Paragraph>
                            ) : (
                                <Paragraph>
                                    <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                                        {product.duration_days > 0 ? `${product.duration_days} Days Access` : 'Lifetime Access'}
                                    </Tag>
                                </Paragraph>
                            )}

                            <div style={{ marginTop: '24px' }}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        icon={product.type === 'credits' ? <CreditCardOutlined /> : <ShoppingCartOutlined />}
                                        onClick={() => handleBuyNow(product)}
                                        style={{ borderRadius: '8px', height: '48px' }}
                                    >
                                        {t('buyNow')}
                                    </Button>
                                    <Button
                                        type="default"
                                        size="large"
                                        block
                                        icon={<ShoppingCartOutlined />}
                                        onClick={() => handleAddToCart(product)}
                                        style={{ borderRadius: '8px', height: '48px' }}
                                    >
                                        {tCart('addedToCart')}
                                    </Button>
                                </Space>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
