'use client';

import React, { useState, useEffect, use } from 'react';
import { Row, Col, Card, Typography, Button, InputNumber, Spin, Tag, Breadcrumb, Divider, App, Carousel, Image as AntImage } from 'antd';
import { ShoppingCartOutlined, HeartOutlined, HeartFilled, HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    price_cents: number;
    compare_at_price_cents: number | null;
    thumbnail_url: string | null;
    images: string[];
    stock_quantity: number;
    sku: string | null;
    category: { id: string; name: string; slug: string } | null;
    featured: boolean;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const t = useTranslations('Shop');
    const tCart = useTranslations('Cart');
    const locale = useLocale();
    const router = useRouter();
    const { addItem } = useCart();
    const { message } = App.useApp();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        fetch(`/api/v1/shop/products/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProduct(data.data);
                } else {
                    router.push(`/${locale}/shop`);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id, locale, router]);

    // Check if in favorites
    useEffect(() => {
        if (!product) return;
        fetch('/api/v1/shop/favorites')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const favIds = data.data.map((f: any) => f.product?.id).filter(Boolean);
                    setIsFavorite(favIds.includes(product.id));
                }
            })
            .catch(() => { });
    }, [product]);

    const handleAddToCart = () => {
        if (!product) return;
        for (let i = 0; i < quantity; i++) {
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
        }
        message.success(tCart('addedToCart'));
    };

    const handleToggleFavorite = async () => {
        if (!product) return;

        try {
            if (isFavorite) {
                await fetch(`/api/v1/shop/favorites?product_id=${product.id}`, { method: 'DELETE' });
                setIsFavorite(false);
                message.success(t('removedFromFavorites'));
            } else {
                await fetch('/api/v1/shop/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: product.id }),
                });
                setIsFavorite(true);
                message.success(t('addedToFavorites'));
            }
        } catch (error) {
            message.error(t('error'));
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!product) {
        return null;
    }

    const images = product.images?.length > 0 ? product.images : (product.thumbnail_url ? [product.thumbnail_url] : []);
    const discount = product.compare_at_price_cents
        ? Math.round((1 - product.price_cents / product.compare_at_price_cents) * 100)
        : 0;

    return (
        <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Breadcrumb */}
            <Breadcrumb
                style={{ marginBottom: '24px' }}
                items={[
                    { title: <Link href={`/${locale}`}><HomeOutlined /></Link> },
                    { title: <Link href={`/${locale}/shop`}>{t('title')}</Link> },
                    { title: product.name },
                ]}
            />

            <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                style={{ marginBottom: '24px', paddingLeft: 0 }}
            >
                {t('backToShop')}
            </Button>

            <Row gutter={48}>
                {/* Images */}
                <Col xs={24} md={12}>
                    <Card styles={{ body: { padding: 0 } }}>
                        {images.length > 0 ? (
                            images.length > 1 ? (
                                <Carousel autoplay>
                                    {images.map((img, index) => (
                                        <div key={index}>
                                            <AntImage
                                                src={img}
                                                alt={`${product.name} - ${index + 1}`}
                                                style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                                                preview
                                            />
                                        </div>
                                    ))}
                                </Carousel>
                            ) : (
                                <AntImage
                                    src={images[0]}
                                    alt={product.name}
                                    style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                                    preview
                                />
                            )
                        ) : (
                            <div style={{
                                height: '400px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f5f5f5'
                            }}>
                                <ShoppingCartOutlined style={{ fontSize: '64px', color: '#ccc' }} />
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Product Info */}
                <Col xs={24} md={12}>
                    <div>
                        {product.category && (
                            <Tag color="blue" style={{ marginBottom: '12px' }}>{product.category.name}</Tag>
                        )}
                        {product.featured && (
                            <Tag color="gold" style={{ marginBottom: '12px' }}>{t('featured')}</Tag>
                        )}

                        <Title level={2} style={{ marginBottom: '16px' }}>{product.name}</Title>

                        {product.short_description && (
                            <Paragraph type="secondary" style={{ fontSize: '16px' }}>
                                {product.short_description}
                            </Paragraph>
                        )}

                        <Divider />

                        {/* Price */}
                        <div style={{ marginBottom: '24px' }}>
                            <Text strong style={{ fontSize: '32px', color: '#1677ff' }}>
                                ${(product.price_cents / 100).toFixed(2)}
                            </Text>
                            {product.compare_at_price_cents && (
                                <>
                                    <Text delete type="secondary" style={{ fontSize: '18px', marginLeft: '12px' }}>
                                        ${(product.compare_at_price_cents / 100).toFixed(2)}
                                    </Text>
                                    <Tag color="red" style={{ marginLeft: '12px' }}>
                                        -{discount}%
                                    </Tag>
                                </>
                            )}
                        </div>

                        {/* Stock */}
                        <div style={{ marginBottom: '24px' }}>
                            {product.stock_quantity > 0 ? (
                                <Tag color="green">{t('inStock')} ({product.stock_quantity})</Tag>
                            ) : (
                                <Tag color="red">{t('outOfStock')}</Tag>
                            )}
                            {product.sku && (
                                <Text type="secondary" style={{ marginLeft: '12px' }}>SKU: {product.sku}</Text>
                            )}
                        </div>

                        {/* Quantity */}
                        <div style={{ marginBottom: '24px' }}>
                            <Text style={{ marginRight: '12px' }}>{t('quantity')}:</Text>
                            <InputNumber
                                min={1}
                                max={product.stock_quantity || 99}
                                value={quantity}
                                onChange={(val) => setQuantity(val || 1)}
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button
                                type="primary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                onClick={handleAddToCart}
                                disabled={product.stock_quantity === 0}
                                style={{ flex: 1 }}
                            >
                                {t('addToCart')}
                            </Button>
                            <Button
                                size="large"
                                icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                onClick={handleToggleFavorite}
                            >
                                {isFavorite ? t('inFavorites') : t('addToFavorites')}
                            </Button>
                        </div>

                        <Divider />

                        {/* Description */}
                        {product.description && (
                            <div>
                                <Title level={4}>{t('description')}</Title>
                                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                    {product.description}
                                </Paragraph>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
}
