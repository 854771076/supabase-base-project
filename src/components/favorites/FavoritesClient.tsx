'use client';

import React, { useState, useEffect } from 'react';
import {
    Row, Col, Card, Typography, Empty, Button, App,
    Skeleton, Tooltip, Badge, Space
} from 'antd';
import {
    ShoppingCartOutlined,
    DeleteOutlined,
    HeartFilled,
    ShoppingOutlined
} from '@ant-design/icons';
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
        status: string; // 假设 'active' 为上架状态
    } | null;
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
    // 用于处理删除时的加载状态
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

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

    const handleRemove = async (e: React.MouseEvent, productId: string) => {
        e.stopPropagation(); // 防止触发卡片点击

        // 乐观更新：先在 UI 上设为正在删除
        setDeletingIds(prev => new Set(prev).add(productId));

        try {
            await fetch(`/api/v1/shop/favorites?product_id=${productId}`, { method: 'DELETE' });
            setFavorites(prev => prev.filter(f => f.product?.id !== productId));
            message.success(tShop('removedFromFavorites'));
        } catch (error) {
            message.error(tShop('error'));
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(productId);
                return next;
            });
        }
    };

    const handleAddToCart = (e: React.MouseEvent, product: FavoriteItem['product']) => {
        e.stopPropagation();
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

    // 计算折扣百分比
    const getDiscountPercentage = (price: number, comparePrice: number | null) => {
        if (!comparePrice || comparePrice <= price) return null;
        const discount = Math.round(((comparePrice - price) / comparePrice) * 100);
        return discount > 0 ? `${discount}% OFF` : null;
    };

    // 格式化金额
    const formatPrice = (cents: number) => (cents / 100).toFixed(2);

    // 骨架屏组件
    const LoadingSkeleton = () => (
        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
            {[1, 2, 3, 4].map((i) => (
                <Col xs={24} sm={12} md={8} lg={6} key={i}>
                    <Card bordered={false} style={{ borderRadius: 12 }}>
                        <Skeleton.Image active style={{ width: '100%', height: 250, marginBottom: 16 }} />
                        <Skeleton active paragraph={{ rows: 2 }} />
                    </Card>
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
                {/* 头部区域 */}
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
                                <Text type="secondary" style={{ fontSize: 14 }}>去挑选一些喜欢的商品吧</Text>
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
                            const isDiscounted = product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents;
                            const discountLabel = getDiscountPercentage(product.price_cents, product.compare_at_price_cents);
                            const isDeleting = deletingIds.has(product.id);

                            return (
                                <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={product.id}>
                                    <Badge.Ribbon
                                        text={discountLabel}
                                        color="#f5222d"
                                        style={{ display: isDiscounted ? 'block' : 'none' }}
                                    >
                                        <Card
                                            hoverable
                                            bordered={false}
                                            style={{
                                                height: '100%',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                                                transition: 'all 0.3s ease',
                                                opacity: isDeleting ? 0.5 : 1,
                                                pointerEvents: isDeleting ? 'none' : 'auto'
                                            }}
                                            bodyStyle={{ padding: '16px' }}
                                            onClick={() => handleProductClick(product.slug)}
                                        >
                                            {/* 图片区域 */}
                                            <div style={{
                                                position: 'relative',
                                                width: '100%',
                                                aspectRatio: '1 / 1', // 保持正方形，或者改成 3/4
                                                background: '#f5f5f5',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                marginBottom: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {product.thumbnail_url ? (
                                                    <img
                                                        src={product.thumbnail_url}
                                                        alt={product.name}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            transition: 'transform 0.5s ease'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    />
                                                ) : (
                                                    <ShoppingCartOutlined style={{ fontSize: '48px', color: '#e0e0e0' }} />
                                                )}

                                                {/* 删除按钮 - 悬浮在右上角 */}
                                                <Tooltip title={tShop('removeFromFavorites') || "Remove"}>
                                                    <Button
                                                        type="text"
                                                        shape="circle"
                                                        icon={<DeleteOutlined />}
                                                        onClick={(e) => handleRemove(e, product.id)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            right: 8,
                                                            background: 'rgba(255, 255, 255, 0.9)',
                                                            color: '#ff4d4f',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                        }}
                                                    />
                                                </Tooltip>
                                            </div>

                                            {/* 内容区域 */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <Tooltip title={product.name}>
                                                    <Text strong style={{
                                                        fontSize: '16px',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: 'block'
                                                    }}>
                                                        {product.name}
                                                    </Text>
                                                </Tooltip>

                                                <Space align="baseline">
                                                    <Text strong style={{ fontSize: '18px', color: '#1677ff' }}>
                                                        ${formatPrice(product.price_cents)}
                                                    </Text>
                                                    {isDiscounted && (
                                                        <Text delete type="secondary" style={{ fontSize: '12px' }}>
                                                            ${formatPrice(product.compare_at_price_cents!)}
                                                        </Text>
                                                    )}
                                                </Space>

                                                {/* 底部按钮区域 */}
                                                <Button
                                                    type="primary"
                                                    block
                                                    icon={<ShoppingCartOutlined />}
                                                    onClick={(e) => handleAddToCart(e, product)}
                                                    style={{
                                                        marginTop: '8px',
                                                        borderRadius: '6px'
                                                    }}
                                                    disabled={product.status !== 'active'}
                                                >
                                                    {product.status === 'active' ? tShop('addToCart') : 'Sold Out'}
                                                </Button>
                                            </div>
                                        </Card>
                                    </Badge.Ribbon>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>
        </div>
    );
}
