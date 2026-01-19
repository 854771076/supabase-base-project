'use client';

import React from 'react';
import { Card, Typography, Button, Badge, Space } from 'antd';
import { ShoppingCartOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from './types';

const { Title, Text } = Typography;

interface ProductCardProps {
    product: Product;
    isFavorite: boolean;
    onAddToCart: (product: Product, e: React.MouseEvent) => void;
    onToggleFavorite: (productId: string, e: React.MouseEvent) => void;
}

export default function ProductCard({
    product,
    isFavorite,
    onAddToCart,
    onToggleFavorite
}: ProductCardProps) {
    const t = useTranslations('Shop');
    const locale = useLocale();
    const router = useRouter();

    const getDiscount = (price: number, comparePrice: number | null) => {
        if (!comparePrice || comparePrice <= price) return null;
        return Math.round(((comparePrice - price) / comparePrice) * 100);
    };

    const discount = getDiscount(product.price_cents, product.compare_at_price_cents);

    return (
        <Badge.Ribbon
            text={discount ? `-${discount}%` : t('featured')}
            color={discount ? '#ff4d4f' : '#1677ff'}
            style={{ display: product.featured || discount ? 'block' : 'none' }}
        >
            <Card
                hoverable
                className="product-card"
                onClick={() => router.push(`/${locale}/shop/${product.slug}`)}
                cover={
                    <div className="image-wrapper">
                        {product.thumbnail_url ? (
                            <Image
                                src={product.thumbnail_url}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="product-image"
                            />
                        ) : (
                            <ShoppingCartOutlined className="placeholder-icon" />
                        )}
                        <div className="hover-actions">
                            <Button
                                type="primary"
                                shape="round"
                                icon={<ShoppingCartOutlined />}
                                onClick={(e) => onAddToCart(product, e)}
                                size="large"
                            >
                                {t('addToCart')}
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="card-content">
                    <div className="card-top">
                        <Text className="category-tag">{product.category?.name || 'General'}</Text>
                        <Button
                            type="text"
                            className="fav-btn"
                            icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                            onClick={(e) => onToggleFavorite(product.id, e)}
                        />
                    </div>

                    <Title level={5} className="product-title">
                        {product.name}
                    </Title>

                    <div className="price-section">
                        <Text className="current-price">
                            ${(product.price_cents / 100).toFixed(2)}
                        </Text>
                        {product.compare_at_price_cents && (
                            <Text delete className="old-price">
                                ${(product.compare_at_price_cents / 100).toFixed(2)}
                            </Text>
                        )}
                    </div>
                </div>
            </Card>
        </Badge.Ribbon>
    );
}
