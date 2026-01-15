'use client';

import React from 'react';
import { Drawer, List, Button, Typography, Space, InputNumber, Empty } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useCart } from './CartContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/i18n/context';

const { Text, Title } = Typography;

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
    locale: string;
}

export default function CartDrawer({ open, onClose, locale }: CartDrawerProps) {
    const { items, removeItem, updateQuantity, totalAmount, itemCount } = useCart();
    const router = useRouter();
    const t = useTranslations('Cart');

    const handleCheckout = () => {
        onClose();
        router.push(`/${locale}/checkout`);
    };

    return (
        <Drawer
            title={
                <Space>
                    <ShoppingCartOutlined />
                    <span>{t('title')} ({itemCount})</span>
                </Space>
            }
            placement="right"
            onClose={onClose}
            open={open}
            width={400}
            extra={
                <Space>
                    <Button onClick={onClose}>{t('continueShopping')}</Button>
                </Space>
            }
            footer={
                items.length > 0 && (
                    <div style={{ padding: '16px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <Text strong style={{ fontSize: '18px' }}>{t('total')}:</Text>
                            <Text strong style={{ fontSize: '18px', color: '#1677ff' }}>
                                ${(totalAmount / 100).toFixed(2)}
                            </Text>
                        </div>
                        <Button type="primary" size="large" block onClick={handleCheckout}>
                            {t('checkout')}
                        </Button>
                    </div>
                )
            }
        >
            {items.length === 0 ? (
                <Empty description={t('emptyCart')} style={{ marginTop: '100px' }} />
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={items}
                    renderItem={(item) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="delete"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeItem(item.id)}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                title={item.name}
                                description={
                                    <Space direction="vertical" size={0}>
                                        <Text type="secondary">${(item.price_cents / 100).toFixed(2)}</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            <InputNumber
                                                min={1}
                                                value={item.quantity}
                                                onChange={(val) => updateQuantity(item.id, val || 1)}
                                                size="small"
                                            />
                                        </div>
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Drawer>
    );
}
