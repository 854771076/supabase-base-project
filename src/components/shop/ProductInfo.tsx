'use client';

import React from 'react';
import { Typography, Space, Tag, Badge, Divider, Card, InputNumber, Button } from 'antd';
import {
    ShoppingCartOutlined, HeartOutlined, HeartFilled,
    ShareAltOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import { Product, ProductVariant } from './types';
import VariantSelector from './VariantSelector';

const { Title, Text, Paragraph } = Typography;

interface ProductInfoProps {
    product: Product;
    price?: number;
    comparePrice?: number | null;
    stock?: number;
    quantity: number;
    onQuantityChange: (value: number | null) => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onAddToCart: () => void;
    // variant props
    selectedAttributes?: Record<string, string>;
    selectedVariant?: ProductVariant | null;
    onAttributeChange?: (optionName: string, value: string) => void;
}

export default function ProductInfo({
    product,
    price,
    comparePrice,
    stock,
    quantity,
    onQuantityChange,
    isFavorite,
    onToggleFavorite,
    onAddToCart,
    selectedAttributes,
    selectedVariant,
    onAttributeChange,
}: ProductInfoProps) {
    const t = useTranslations('Shop');

    const displayPrice = price ?? product.min_price_cents;
    const displayComparePrice = comparePrice !== undefined ? comparePrice : product.min_compare_at_price_cents;
    const displayStock = stock ?? product.total_stock_quantity;

    const discount = displayComparePrice
        ? Math.round((1 - displayPrice / displayComparePrice) * 100)
        : 0;

    const hasVariants = (product.variant_options?.length ?? 0) > 0 && (product.variants?.length ?? 0) > 0
        && selectedAttributes !== undefined && onAttributeChange !== undefined;

    return (
        <div className="info-section">
            <Space size={8} style={{ marginBottom: 12 }}>
                {product.category && <Tag color="blue" className="custom-tag">{product.category.name}</Tag>}
                {product.featured && <Tag color="gold" className="custom-tag">{t('featured')}</Tag>}
            </Space>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Title level={1} className="product-title">{product.name}</Title>
                <Button type="text" icon={<ShareAltOutlined />} style={{ marginTop: 8 }} title={t('share')} />
            </div>

            <div className="meta-info">
                <Badge status={displayStock > 0 ? 'success' : 'error'}
                    text={displayStock > 0 ? t('inStock') : t('outOfStock')} />
            </div>

            {product.short_description && (
                <Paragraph className="short-desc">{product.short_description}</Paragraph>
            )}

            {/* Variant selector — sits between description and purchase card */}
            {hasVariants && (
                <VariantSelector
                    variantOptions={product.variant_options!}
                    variants={product.variants!}
                    selectedAttributes={selectedAttributes!}
                    onAttributeChange={onAttributeChange!}
                    selectedVariant={selectedVariant ?? null}
                />
            )}

            <Card className="purchase-card" bordered={false}>
                <div className="price-box">
                    <Text className="current-price">${(displayPrice / 100).toFixed(2)}</Text>
                    {displayComparePrice && (
                        <Space align="center">
                            <Text delete type="secondary" className="old-price">
                                ${(displayComparePrice / 100).toFixed(2)}
                            </Text>
                            <Tag color="#ff4d4f" className="discount-tag">{t('off').replace('{percent}', discount.toString())}</Tag>
                        </Space>
                    )}
                </div>

                <Divider style={{ margin: '20px 0' }} />

                <div className="quantity-selector">
                    <Text strong>{t('quantity')}</Text>
                    <InputNumber
                        min={1}
                        max={displayStock || 1}
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
                        disabled={displayStock === 0}
                        className="add-to-cart-btn"
                    >
                        {t('addToCart')}
                    </Button>
                    <button
                        onClick={onToggleFavorite}
                        className={`fav-btn-custom ${isFavorite ? 'fav-active' : ''}`}
                        title={isFavorite ? t('inFavorites') : t('addToFavorites')}
                    >
                        {isFavorite
                            ? <HeartFilled style={{ fontSize: 22 }} />
                            : <HeartOutlined style={{ fontSize: 22 }} />}
                    </button>
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
