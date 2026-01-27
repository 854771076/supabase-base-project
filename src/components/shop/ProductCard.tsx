'use client';

import React from 'react';
import { Card, Typography, Button, Badge, Space, Tooltip } from 'antd';
import { ShoppingCartOutlined, HeartOutlined, HeartFilled, EyeOutlined } from '@ant-design/icons';
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
    showHoverActions?: boolean;
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
            style={{ display: product.featured || discount ? 'block' : 'none', top: 12, right: -6 }}
        >
            <Card
                hoverable
                bordered={false}
                className="premium-product-card"
                onClick={() => router.push(`/${locale}/shop/${product.slug}`)}
                style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    height: '100%',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    transition: 'all 0.3s ease',
                }}
                cover={
                    <div className="image-container">
                        {product.thumbnail_url ? (
                            <Image
                                src={product.thumbnail_url}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="product-image"
                            />
                        ) : (
                            <div className="placeholder-image">
                                <ShoppingCartOutlined style={{ fontSize: 48, color: '#e0e0e0' }} />
                            </div>
                        )}
                        
                        {/* Overlay Actions */}
                        <div className="overlay-actions">
                             <Tooltip title={t('addToCart')}>
                                <Button 
                                    shape="circle" 
                                    size="large"
                                    type="primary"
                                    icon={<ShoppingCartOutlined />} 
                                    onClick={(e) => onAddToCart(product, e)}
                                    className="action-btn"
                                />
                             </Tooltip>
                             <Tooltip title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}>
                                <Button 
                                    shape="circle" 
                                    size="large"
                                    className="action-btn fav-btn"
                                    icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />} 
                                    onClick={(e) => onToggleFavorite(product.id, e)}
                                />
                             </Tooltip>
                        </div>
                    </div>
                }
                bodyStyle={{ padding: '20px 16px' }}
            >
                <div className="card-custom-body">
                    <div className="category-label">
                        {product.category?.name || 'ASSET'}
                    </div>
                    
                    <Title level={5} className="product-title" title={product.name}>
                        {product.name}
                    </Title>

                    <div className="price-row">
                        <Space align="baseline" size={8}>
                            <Text className="price-current">
                                ${(product.price_cents / 100).toFixed(2)}
                            </Text>
                            {product.compare_at_price_cents && (
                                <Text delete className="price-old">
                                    ${(product.compare_at_price_cents / 100).toFixed(2)}
                                </Text>
                            )}
                        </Space>
                    </div>
                </div>

                <style jsx global>{`
                    .premium-product-card:hover {
                        transform: translateY(-8px);
                        box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important;
                    }
                    .image-container {
                        position: relative;
                        width: 100%;
                        aspect-ratio: 4/3;
                        background: #f8f8f8;
                        overflow: hidden;
                    }
                    .product-image {
                        object-fit: cover;
                        transition: transform 0.5s ease;
                    }
                    .premium-product-card:hover .product-image {
                        transform: scale(1.08);
                    }
                    .placeholder-image {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .overlay-actions {
                        position: absolute;
                        bottom: 16px;
                        left: 50%;
                        transform: translateX(-50%) translateY(20px);
                        display: flex;
                        gap: 12px;
                        opacity: 0;
                        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                        z-index: 2;
                        width: 100%;
                        justify-content: center;
                    }
                    
                    .premium-product-card:hover .overlay-actions {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }

                    .action-btn {
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        border: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .action-btn.fav-btn {
                        background: white;
                        color: #595959;
                    }
                    .action-btn.fav-btn:hover {
                        background: #fff0f6;
                        color: #ff4d4f;
                    }

                    .card-custom-body {
                        display: flex;
                        flex-direction: column;
                    }
                    .category-label {
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #8c8c8c;
                        font-weight: 600;
                        margin-bottom: 8px;
                    }
                    .product-title {
                        margin-bottom: 8px !important;
                        font-size: 16px !important;
                        line-height: 1.4 !important;
                        height: 44px; /* 2 lines */
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                    }
                    .price-current {
                        font-size: 18px;
                        font-weight: 700;
                        color: #1f1f1f;
                    }
                    .price-old {
                        font-size: 13px;
                        color: #bfbfbf;
                    }
                `}</style>
            </Card>
        </Badge.Ribbon>
    );
}
