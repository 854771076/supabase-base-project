'use client';

import React from 'react';
import { Typography, Space, Tag, Badge, Divider, Card, InputNumber, Button, Tooltip } from 'antd';
import {
    ShoppingCartOutlined, HeartOutlined, HeartFilled,
    ShareAltOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import { Product } from './types';

const { Title, Text, Paragraph } = Typography;

interface ProductInfoProps {
    product: Product;
    quantity: number;
    onQuantityChange: (value: number | null) => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onAddToCart: () => void;
}

export default function ProductInfo({
    product,
    quantity,
    onQuantityChange,
    isFavorite,
    onToggleFavorite,
    onAddToCart
}: ProductInfoProps) {
    const t = useTranslations('Shop');
    const discount = product.compare_at_price_cents
        ? Math.round((1 - product.price_cents / product.compare_at_price_cents) * 100)
        : 0;

    return (
        <div className="info-section">
            <Space size={8} style={{ marginBottom: 12 }}>
                {product.category && <Tag color="blue" className="custom-tag">{product.category.name}</Tag>}
                {product.featured && <Tag color="gold" className="custom-tag">{t('featured')}</Tag>}
            </Space>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Title level={1} className="product-title">{product.name}</Title>
                <Button type="text" icon={<ShareAltOutlined />} style={{ marginTop: 8 }} />
            </div>

            <div className="meta-info">
                <Badge status={product.stock_quantity > 0 ? 'success' : 'error'}
                    text={product.stock_quantity > 0 ? t('inStock') : t('outOfStock')} />
                <Divider type="vertical" />
                <Text type="secondary">SKU: {product.sku || 'N/A'}</Text>
            </div>

            {product.short_description && (
                <Paragraph className="short-desc">{product.short_description}</Paragraph>
            )}

            <Card className="purchase-card" bordered={false}>
                <div className="price-box">
                    <Text className="current-price">${(product.price_cents / 100).toFixed(2)}</Text>
                    {product.compare_at_price_cents && (
                        <Space align="center">
                            <Text delete type="secondary" className="old-price">
                                ${(product.compare_at_price_cents / 100).toFixed(2)}
                            </Text>
                            <Tag color="#ff4d4f" className="discount-tag">{discount}% OFF</Tag>
                        </Space>
                    )}
                </div>

                <Divider style={{ margin: '20px 0' }} />

                <div className="quantity-selector">
                    <Text strong>{t('quantity')}</Text>
                    <InputNumber
                        min={1}
                        max={product.stock_quantity || 1}
                        value={quantity}
                        onChange={onQuantityChange}
                        className="custom-input-number"
                    />
                </div>

                <div className="action-buttons">
                    <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingCartOutlined />}
                        onClick={onAddToCart}
                        disabled={product.stock_quantity === 0}
                        className="add-to-cart-btn"
                    >
                        {t('addToCart')}
                    </Button>
                    <Tooltip title={isFavorite ? '取消收藏' : '加入收藏'}>
                        <Button
                            size="large"
                            icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                            onClick={onToggleFavorite}
                            className="fav-btn"
                        />
                    </Tooltip>
                </div>
            </Card>

            {product.description && (
                <div className="full-description">
                    <Title level={4}><InfoCircleOutlined /> {t('description')}</Title>
                    <Paragraph style={{ whiteSpace: 'pre-wrap', color: '#666' }}>
                        {product.description}
                    </Paragraph>
                </div>
            )}
        </div>
    );
}
