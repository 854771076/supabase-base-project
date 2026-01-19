'use client';

import React, { useState, useEffect, use } from 'react';
import { Row, Col, Card, Typography, Button, InputNumber, Spin, Tag, Breadcrumb, Divider, App, Carousel, Image as AntImage, Space, Badge } from 'antd';
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
            {/* Breadcrumb & Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <Breadcrumb
                    items={[
                        { title: <Link href={`/${locale}`}><HomeOutlined /></Link> },
                        { title: <Link href={`/${locale}/shop`}>{t('title')}</Link> },
                        { title: <Text type="secondary" style={{ maxWidth: '150px' }} ellipsis>{product.name}</Text> },
                    ]}
                />
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                    style={{ color: '#1677ff', fontWeight: 500 }}
                >
                    {t('backToShop')}
                </Button>
            </div>

            <Row gutter={[48, 48]}>
                {/* Images Section */}
                <Col xs={24} md={12}>
                    <div style={{ position: 'sticky', top: '24px' }}>
                        <div style={{
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: '#fff',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                            border: '1px solid #f0f0f0'
                        }}>
                            {images.length > 0 ? (
                                <Carousel
                                    autoplay
                                    dots={false}
                                    ref={(node) => { (window as any).carousel = node; }}
                                    effect="fade"
                                >
                                    {images.map((img, index) => (
                                        <div key={index} className="carousel-image-container">
                                            <AntImage
                                                src={img}
                                                alt={`${product.name} - ${index + 1}`}
                                                className="main-product-image"
                                                preview={true}
                                            />
                                        </div>
                                    ))}
                                </Carousel>
                            ) : (
                                <div className="empty-image-container">
                                    <ShoppingCartOutlined style={{ fontSize: '64px', color: '#f0f0f0' }} />
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '20px',
                                overflowX: 'auto',
                                padding: '4px 0',
                                scrollbarWidth: 'none'
                            }}>
                                {images.map((img, index) => (
                                    <div
                                        key={index}
                                        onClick={() => (window as any).carousel?.goTo(index)}
                                        style={{
                                            width: '72px',
                                            height: '72px',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            border: '2px solid #f0f0f0',
                                            flexShrink: 0,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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

                {/* Product Info Section */}
                <Col xs={24} md={12}>
                    <div style={{ padding: '8px 0' }}>
                        <Space size={8} wrap style={{ marginBottom: '20px' }}>
                            {product.category && (
                                <Tag bordered={false} color="blue" style={{ borderRadius: '6px', fontSize: '13px' }}>
                                    {product.category.name}
                                </Tag>
                            )}
                            {product.featured && (
                                <Tag bordered={false} color="gold" style={{ borderRadius: '6px', fontSize: '13px' }}>
                                    {t('featured')}
                                </Tag>
                            )}
                        </Space>

                        <Title level={1} style={{ marginBottom: '16px', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.2 }}>
                            {product.name}
                        </Title>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                            {product.stock_quantity > 0 ? (
                                <Badge status="success" text={<Text type="secondary">{t('inStock')}</Text>} />
                            ) : (
                                <Badge status="error" text={<Text type="danger">{t('outOfStock')}</Text>} />
                            )}
                            <Divider type="vertical" />
                            <Text type="secondary" style={{ fontSize: '14px' }}>SKU: {product.sku || 'N/A'}</Text>
                        </div>

                        {product.short_description && (
                            <Paragraph style={{ fontSize: '16px', color: '#595959', lineHeight: 1.7, marginBottom: '32px' }}>
                                {product.short_description}
                            </Paragraph>
                        )}

                        <div style={{
                            background: '#fafafa',
                            padding: '32px',
                            borderRadius: '20px',
                            marginBottom: '40px',
                            border: '1px solid #f0f0f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
                                <Text strong style={{ fontSize: '42px', color: '#1a1a1a', lineHeight: 1 }}>
                                    ${(product.price_cents / 100).toFixed(2)}
                                </Text>
                                {product.compare_at_price_cents && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Text delete type="secondary" style={{ fontSize: '20px' }}>
                                            ${(product.compare_at_price_cents / 100).toFixed(2)}
                                        </Text>
                                        <Tag color="#ff4d4f" style={{ margin: 0, borderRadius: '4px', fontWeight: 700, border: 'none' }}>
                                            {discount}% OFF
                                        </Tag>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quantity & Actions */}
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Text strong style={{ fontSize: '16px' }}>{t('quantity')}</Text>
                                <Text type="secondary" style={{ fontSize: '14px' }}>
                                    {product.stock_quantity} {t('itemsAvailable')}
                                </Text>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <InputNumber
                                    min={1}
                                    max={product.stock_quantity || 99}
                                    value={quantity}
                                    onChange={(val) => setQuantity(val || 1)}
                                    size="large"
                                    style={{
                                        width: '140px',
                                        borderRadius: '12px',
                                        height: '56px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                />
                                <div className="product-actions-group">
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<ShoppingCartOutlined />}
                                        onClick={handleAddToCart}
                                        disabled={product.stock_quantity === 0}
                                        className="primary-cta-btn"
                                    >
                                        {t('addToCart')}
                                    </Button>
                                    <Button
                                        size="large"
                                        icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                        onClick={handleToggleFavorite}
                                        className="secondary-cta-btn"
                                    >
                                        {isFavorite ? t('inFavorites') : t('addToFavorites')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* Description Section */}
                        {product.description && (
                            <div style={{ marginTop: '40px' }}>
                                <Title level={4} style={{ marginBottom: '20px', fontSize: '20px' }}>{t('description')}</Title>
                                <div style={{
                                    fontSize: '16px',
                                    lineHeight: 1.8,
                                    color: '#434343',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {product.description}
                                </div>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

            <style jsx global>{`
                .thumbnail-item:hover {
                    border-color: #1677ff !important;
                    transform: translateY(-2px);
                }
                .carousel-image-container {
                    width: 100%;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .main-product-image {
                    width: 100% !important;
                    height: auto !important;
                    aspect-ratio: 1 / 1;
                    object-fit: contain !important;
                }
                .empty-image-container {
                    aspect-ratio: 1 / 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fdfdfd;
                }
                .product-actions-group {
                    display: flex;
                    gap: 12px;
                    flex: 1;
                    min-width: 300px;
                }
                .primary-cta-btn {
                    flex: 2;
                    height: 56px !important;
                    font-size: 18px !important;
                    font-weight: 600 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 16px rgba(22, 119, 255, 0.15) !important;
                }
                .secondary-cta-btn {
                    flex: 1;
                    height: 56px !important;
                    font-size: 16px !important;
                    border-radius: 12px !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                @media (max-width: 767px) {
                    .product-actions-group {
                        width: 100%;
                        flex-direction: column;
                        min-width: auto;
                    }
                    .primary-cta-btn, .secondary-cta-btn {
                        width: 100% !important;
                        flex: none;
                    }
                    .main-product-image {
                        aspect-ratio: 1 / 1;
                    }
                }
            `}</style>
        </div>
    );
}
