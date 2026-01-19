'use client';

import React, { useState, useEffect, use } from 'react';
import { Row, Col, Card, Typography, Button, InputNumber, Spin, Tag, Breadcrumb, Divider, App, Carousel, Image as AntImage, Space } from 'antd';
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

            <Row gutter={[48, 48]}>
                {/* Images */}
                <Col xs={24} md={12}>
                    <div style={{ position: 'sticky', top: '24px' }}>
                        <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                            {images.length > 0 ? (
                                <Carousel
                                    autoplay
                                    dots={false}
                                    ref={(node) => { (window as any).carousel = node; }}
                                >
                                    {images.map((img, index) => (
                                        <div key={index} className="carousel-image-container">
                                            <AntImage
                                                src={img}
                                                alt={`${product.name} - ${index + 1}`}
                                                className="main-product-image"
                                                preview
                                            />
                                        </div>
                                    ))}
                                </Carousel>
                            ) : (
                                <div className="empty-image-container">
                                    <ShoppingCartOutlined style={{ fontSize: '64px', color: '#ccc' }} />
                                </div>
                            )}
                        </Card>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {images.map((img, index) => (
                                    <div
                                        key={index}
                                        onClick={() => (window as any).carousel?.goTo(index)}
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            border: '2px solid #f0f0f0',
                                            flexShrink: 0,
                                            transition: 'all 0.3s ease'
                                        }}
                                        className="thumbnail-item"
                                    >
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Col>

                {/* Product Info */}
                <Col xs={24} md={12}>
                    <div style={{ padding: '12px 0' }}>
                        <Space size={[0, 8]} wrap style={{ marginBottom: '16px' }}>
                            {product.category && (
                                <Tag color="blue" style={{ borderRadius: '4px', padding: '2px 8px' }}>{product.category.name}</Tag>
                            )}
                            {product.featured && (
                                <Tag color="gold" style={{ borderRadius: '4px', padding: '2px 8px' }}>{t('featured')}</Tag>
                            )}
                            {product.stock_quantity > 0 ? (
                                <Tag color="green" style={{ borderRadius: '4px', padding: '2px 8px' }}>{t('inStock')}</Tag>
                            ) : (
                                <Tag color="red" style={{ borderRadius: '4px', padding: '2px 8px' }}>{t('outOfStock')}</Tag>
                            )}
                        </Space>

                        <Title level={1} style={{ marginBottom: '16px', fontSize: '36px', fontWeight: 700 }}>{product.name}</Title>

                        {product.short_description && (
                            <Paragraph style={{ fontSize: '18px', color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
                                {product.short_description}
                            </Paragraph>
                        )}

                        <div style={{
                            background: '#f0f7ff',
                            padding: '24px',
                            borderRadius: '12px',
                            marginBottom: '32px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                <Text strong style={{ fontSize: '40px', color: '#1677ff' }}>
                                    ${(product.price_cents / 100).toFixed(2)}
                                </Text>
                                {product.compare_at_price_cents && (
                                    <>
                                        <Text delete type="secondary" style={{ fontSize: '20px' }}>
                                            ${(product.compare_at_price_cents / 100).toFixed(2)}
                                        </Text>
                                        <Tag color="red" style={{ fontSize: '14px', fontWeight: 600 }}>
                                            -{discount}% OFF
                                        </Tag>
                                    </>
                                )}
                            </div>
                            {product.sku && (
                                <div style={{ marginTop: '8px' }}>
                                    <Text type="secondary">SKU: {product.sku}</Text>
                                </div>
                            )}
                        </div>

                        {/* Quantity & Actions */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <Text strong style={{ fontSize: '16px' }}>{t('quantity')}:</Text>
                            </div>
                            <Space size={16} align="center">
                                <InputNumber
                                    min={1}
                                    max={product.stock_quantity || 99}
                                    value={quantity}
                                    onChange={(val) => setQuantity(val || 1)}
                                    size="large"
                                    style={{ width: '120px', borderRadius: '8px' }}
                                />
                                <Text type="secondary">
                                    {product.stock_quantity} {t('itemsAvailable')}
                                </Text>
                            </Space>
                        </div>

                        <div className="product-actions-container">
                            <Button
                                type="primary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                onClick={handleAddToCart}
                                disabled={product.stock_quantity === 0}
                                className="add-to-cart-btn"
                            >
                                {t('addToCart')}
                            </Button>
                            <Button
                                size="large"
                                icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                onClick={handleToggleFavorite}
                                className="favorite-btn"
                            >
                                {isFavorite ? t('inFavorites') : t('addToFavorites')}
                            </Button>
                        </div>

                        <Divider />

                        {/* Description */}
                        {product.description && (
                            <div style={{ marginTop: '32px' }}>
                                <Title level={4} style={{ marginBottom: '16px' }}>{t('description')}</Title>
                                <Paragraph style={{
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '16px',
                                    lineHeight: 1.8,
                                    color: '#444'
                                }}>
                                    {product.description}
                                </Paragraph>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

            <style jsx global>{`
                .thumbnail-item:hover {
                    border-color: #1677ff !important;
                    transform: scale(1.05);
                }
                .ant-carousel .slick-slide {
                    border-radius: 12px;
                    overflow: hidden;
                }
                .carousel-image-container {
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    background: #f9f9f9;
                }
                .main-product-image {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                .empty-image-container {
                    aspect-ratio: 1 / 1;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                    background: #f9f9f9;
                }
                @media (min-width: 768px) {
                    .carousel-image-container, .empty-image-container {
                        height: 500px;
                        aspect-ratio: auto;
                    }
                }
                @media (max-width: 767px) {
                    .thumbnail-item {
                        width: 60px !important;
                        height: 60px !important;
                    }
                    .product-actions-container {
                        flex-direction: column !important;
                    }
                    .add-to-cart-btn, .favorite-btn {
                        width: 100% !important;
                    }
                }
                .product-actions-container {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 40px;
                }
                .add-to-cart-btn {
                    flex: 2;
                    height: 56px !important;
                    font-size: 18px !important;
                    font-weight: 600 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2) !important;
                }
                .favorite-btn {
                    flex: 1;
                    height: 56px !important;
                    font-size: 18px !important;
                    border-radius: 12px !important;
                }
            `}</style>
        </div>
    );
}
