'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Empty, Button, App, Skeleton, Tag } from 'antd';
import { HeartFilled, HeartOutlined, ShoppingOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';
import { Product } from '@/components/shop/types';
import Link from 'next/link';

const { Title, Text } = Typography;

interface FavoriteItem {
    id: string;
    created_at: string;
    product: Product | null;
}

function FavoriteCard({
    product,
    onRemove,
    onAddToCart,
    locale,
}: {
    product: Product;
    onRemove: (id: string, e: React.MouseEvent) => void;
    onAddToCart: (product: Product, e: React.MouseEvent) => void;
    locale: string;
}) {
    const [hovered, setHovered] = useState(false);
    const hasDiscount = (product.min_compare_at_price_cents ?? 0) > (product.min_price_cents ?? 0);
    const discount = hasDiscount
        ? Math.round((1 - (product.min_price_cents ?? 0) / (product.min_compare_at_price_cents ?? 1)) * 100)
        : 0;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                borderRadius: 16,
                overflow: 'hidden',
                background: '#fff',
                border: '1px solid #f0f0f0',
                boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                transform: hovered ? 'translateY(-3px)' : 'none',
                cursor: 'pointer',
                position: 'relative',
            }}
        >
            {/* Image */}
            <Link href={`/${locale}/shop/${product.slug}`} style={{ display: 'block' }}>
                <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#fafafa' }}>
                    {product.thumbnail_url ? (
                        <img
                            src={product.thumbnail_url}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d9d9d9', fontSize: 48 }}>
                            <ShoppingOutlined />
                        </div>
                    )}
                    {hasDiscount && (
                        <Tag color="#ff4d4f" style={{ position: 'absolute', top: 10, left: 10, fontWeight: 700, border: 'none', borderRadius: 6 }}>
                            -{discount}%
                        </Tag>
                    )}
                </div>
            </Link>

            {/* Remove button — top right */}
            <button
                onClick={(e) => onRemove(product.id, e)}
                style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.92)',
                    border: '1px solid #ffe0e0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#ff4d4f',
                    boxShadow: '0 2px 8px rgba(255,77,79,0.15)',
                    transition: 'all 0.15s',
                    opacity: hovered ? 1 : 0.7,
                }}
                title="Remove from favorites"
            >
                <HeartFilled style={{ fontSize: 15 }} />
            </button>

            {/* Info */}
            <div style={{ padding: '14px 16px 16px' }}>
                <Link href={`/${locale}/shop/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <Text strong style={{ fontSize: 14, color: '#1a1a1a', display: 'block', marginBottom: 6, lineHeight: 1.4 }}
                        ellipsis={{ tooltip: product.name }}>
                        {product.name}
                    </Text>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
                        ${((product.min_price_cents ?? 0) / 100).toFixed(2)}
                        {(product.max_price_cents ?? 0) > (product.min_price_cents ?? 0) && '+'}
                    </Text>
                    {hasDiscount && (
                        <Text delete type="secondary" style={{ fontSize: 13 }}>
                            ${((product.min_compare_at_price_cents ?? 0) / 100).toFixed(2)}
                        </Text>
                    )}
                </div>

                <Button
                    type="primary"
                    size="small"
                    icon={<ShoppingCartOutlined />}
                    onClick={(e) => onAddToCart(product, e)}
                    disabled={(product.total_stock_quantity ?? 0) === 0}
                    style={{ width: '100%', borderRadius: 8, height: 36, fontWeight: 500 }}
                >
                    {(product.total_stock_quantity ?? 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
            </div>
        </div>
    );
}

export default function FavoritesClient() {
    const locale = useLocale();
    const t = useTranslations('Favorites');
    const tShop = useTranslations('Shop');
    const router = useRouter();
    const { addItem } = useCart();
    const { message } = App.useApp();

    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/shop/favorites')
            .then(r => r.json())
            .then(data => {
                if (data.success) setFavorites(data.data.filter((f: FavoriteItem) => f.product));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleRemove = async (productId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/v1/shop/favorites?product_id=${productId}`, { method: 'DELETE' });
            setFavorites(prev => prev.filter(f => f.product?.id !== productId));
            message.success(tShop('removedFromFavorites'));
        } catch {
            message.error(tShop('error'));
        }
    };

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        addItem({
            id: product.id,
            name: product.name,
            price_cents: product.min_price_cents ?? 0,
            type: 'product',
            metadata: { image: product.thumbnail_url, slug: product.slug },
        });
        message.success(tShop('addedToCart'));
    };

    return (
        <div style={{ minHeight: '80vh', background: '#f7f8fa', padding: '48px 24px' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <HeartFilled style={{ color: '#ff4d4f', fontSize: 28 }} />
                        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{t('title')}</Title>
                        {!loading && favorites.length > 0 && (
                            <span style={{
                                background: '#ff4d4f', color: '#fff',
                                borderRadius: 20, padding: '2px 10px',
                                fontSize: 13, fontWeight: 600,
                            }}>
                                {favorites.length}
                            </span>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 15 }}>{t('subtitle')}</Text>
                </div>

                {loading ? (
                    <Row gutter={[24, 24]}>
                        {[1, 2, 3, 4].map(i => (
                            <Col xs={24} sm={12} md={8} lg={6} key={i}>
                                <Skeleton.Image active style={{ width: '100%', height: 200, borderRadius: 16 }} />
                                <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 12 }} />
                            </Col>
                        ))}
                    </Row>
                ) : favorites.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px 24px',
                        background: '#fff', borderRadius: 20,
                        border: '1px solid #f0f0f0',
                    }}>
                        <HeartOutlined style={{ fontSize: 56, color: '#ffccc7', marginBottom: 16 }} />
                        <Title level={4} style={{ color: '#595959', marginBottom: 8 }}>{t('empty')}</Title>
                        <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 24 }}>
                            Go find something you love!
                        </Text>
                        <Button
                            type="primary" size="large" shape="round"
                            icon={<ShoppingOutlined />}
                            onClick={() => router.push(`/${locale}/shop`)}
                            style={{ height: 48, paddingInline: 32 }}
                        >
                            {t('goShopping')}
                        </Button>
                    </div>
                ) : (
                    <Row gutter={[20, 24]}>
                        {favorites.map(({ product }) => {
                            if (!product) return null;
                            return (
                                <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={product.id}>
                                    <FavoriteCard
                                        product={product}
                                        onRemove={handleRemove}
                                        onAddToCart={handleAddToCart}
                                        locale={locale}
                                    />
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>
        </div>
    );
}
