'use client';

import React, { useState, useEffect } from 'react';
import {
    Row, Col, Typography, Empty, Button, App,
    Skeleton
} from 'antd';
import {
    HeartFilled,
    ShoppingOutlined
} from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';
import ProductCard from '@/components/shop/ProductCard';
import { Product } from '@/components/shop/types';

const { Title, Text, Paragraph } = Typography;

interface FavoriteItem {
    id: string;
    created_at: string;
    product: Product | null;
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
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const res = await fetch('/api/v1/shop/favorites');
            const data = await res.json();
            if (data.success) {
                // Ensure product structure matches Product type
                setFavorites(data.data.filter((f: FavoriteItem) => f.product));
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async (productId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // For favorites page, toggle means remove
        try {
            await fetch(`/api/v1/shop/favorites?product_id=${productId}`, { method: 'DELETE' });
            setFavorites(prev => prev.filter(f => f.product?.id !== productId));
            message.success(tShop('removedFromFavorites'));
        } catch (error) {
            message.error(tShop('error'));
        }
    };

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        addItem({
            id: product.id,
            name: product.name,
            price_cents: product.price_cents,
            type: 'product',
            metadata: { image: product.thumbnail_url, slug: product.slug },
        });
        message.success(tShop('addedToCart'));
    };

    const LoadingSkeleton = () => (
        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
            {[1, 2, 3, 4].map((i) => (
                <Col xs={24} sm={12} md={8} lg={6} key={i}>
                    <Skeleton active paragraph={{ rows: 6 }} />
                </Col>
            ))}
        </Row>
    );

    return (
        <div style={{
            minHeight: '80vh',
            background: '#fafafa',
            padding: '40px 24px'
        }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <Title level={2} style={{ marginBottom: 8 }}>
                        {t('title')} <HeartFilled style={{ color: '#ff4d4f', fontSize: '28px' }} />
                    </Title>
                    <Paragraph type="secondary" style={{ fontSize: '16px' }}>
                        {t('subtitle')}
                        {!loading && favorites.length > 0 && ` (${favorites.length})`}
                    </Paragraph>
                </div>

                {loading ? (
                    <LoadingSkeleton />
                ) : favorites.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <Text type="secondary" style={{ fontSize: 16 }}>{t('empty')}</Text>
                                <Text type="secondary" style={{ fontSize: 14 }}>Go find something you love!</Text>
                            </div>
                        }
                        style={{ padding: '80px 0', background: '#fff', borderRadius: 16 }}
                    >
                        <Button
                            type="primary"
                            size="large"
                            shape="round"
                            icon={<ShoppingOutlined />}
                            onClick={() => router.push(`/${locale}/shop`)}
                            style={{ marginTop: 16, height: 48, paddingLeft: 32, paddingRight: 32 }}
                        >
                            {t('goShopping')}
                        </Button>
                    </Empty>
                ) : (
                    <Row gutter={[24, 32]}>
                        {favorites.map(({ product }) => {
                            if (!product) return null;
                            return (
                                <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={product.id}>
                                    <ProductCard
                                        product={product}
                                        isFavorite={true}
                                        onAddToCart={handleAddToCart}
                                        onToggleFavorite={handleToggleFavorite}
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
