'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Spin, Empty, Button, App } from 'antd';
import { ShoppingCartOutlined, HeartFilled, DeleteOutlined } from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';

const { Title, Text, Paragraph } = Typography;

interface FavoriteItem {
    id: string;
    created_at: string;
    product: {
        id: string;
        name: string;
        slug: string;
        price_cents: number;
        compare_at_price_cents: number | null;
        thumbnail_url: string | null;
        status: string;
    } | null;
}

export default function FavoritesPage() {
    const t = useTranslations('Favorites');
    const tShop = useTranslations('Shop');
    const locale = useLocale();
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
                setFavorites(data.data.filter((f: FavoriteItem) => f.product));
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (productId: string) => {
        try {
            await fetch(`/api/v1/shop/favorites?product_id=${productId}`, { method: 'DELETE' });
            setFavorites(prev => prev.filter(f => f.product?.id !== productId));
            message.success(tShop('removedFromFavorites'));
        } catch (error) {
            message.error(tShop('error'));
        }
    };

    const handleAddToCart = (product: FavoriteItem['product']) => {
        if (!product) return;
        addItem({
            id: product.id,
            name: product.name,
            price_cents: product.price_cents,
            type: 'product',
            metadata: {
                image: product.thumbnail_url,
                slug: product.slug,
            },
        });
        message.success(tShop('addedToCart'));
    };

    const handleProductClick = (slug: string) => {
        router.push(`/${locale}/shop/${slug}`);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={2}>{t('title')}</Title>
            <Paragraph type="secondary">{t('subtitle')}</Paragraph>

            {favorites.length === 0 ? (
                <Empty
                    description={t('empty')}
                    style={{ marginTop: '80px' }}
                >
                    <Button type="primary" onClick={() => router.push(`/${locale}/shop`)}>
                        {t('goShopping')}
                    </Button>
                </Empty>
            ) : (
                <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
                    {favorites.map(({ product }) => product && (
                        <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                            <Card
                                hoverable
                                onClick={() => handleProductClick(product.slug)}
                                cover={
                                    <div style={{
                                        height: '180px',
                                        background: '#f5f5f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {product.thumbnail_url ? (
                                            <img
                                                src={product.thumbnail_url}
                                                alt={product.name}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <ShoppingCartOutlined style={{ fontSize: '40px', color: '#ccc' }} />
                                        )}
                                    </div>
                                }
                                actions={[
                                    <Button
                                        key="cart"
                                        type="text"
                                        icon={<ShoppingCartOutlined />}
                                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                    />,
                                    <Button
                                        key="remove"
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => { e.stopPropagation(); handleRemove(product.id); }}
                                    />
                                ]}
                            >
                                <Card.Meta
                                    title={product.name}
                                    description={
                                        <div>
                                            <Text strong style={{ color: '#1677ff' }}>
                                                ${(product.price_cents / 100).toFixed(2)}
                                            </Text>
                                            {product.compare_at_price_cents && (
                                                <Text delete type="secondary" style={{ marginLeft: '8px' }}>
                                                    ${(product.compare_at_price_cents / 100).toFixed(2)}
                                                </Text>
                                            )}
                                        </div>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
}
