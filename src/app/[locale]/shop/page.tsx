'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Input, Select, Spin, Empty, Button, Tag, Pagination, App, Badge } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';
import Image from 'next/image';

const { Title, Text, Paragraph } = Typography;

interface Product {
    id: string;
    name: string;
    slug: string;
    price_cents: number;
    compare_at_price_cents: number | null;
    thumbnail_url: string | null;
    short_description: string | null;
    category: { id: string; name: string; slug: string } | null;
    featured: boolean;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function ShopPage() {
    const t = useTranslations('Shop');
    const locale = useLocale();
    const router = useRouter();
    const { addItem } = useCart();
    const { message } = App.useApp();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    // Filters
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 12;

    // Fetch categories
    useEffect(() => {
        fetch('/api/v1/shop/categories')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCategories(data.data);
                }
            })
            .catch(console.error);
    }, []);

    // Fetch products
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            limit: pageSize.toString(),
            offset: ((page - 1) * pageSize).toString(),
        });

        if (search) params.set('search', search);
        if (selectedCategory) params.set('category_id', selectedCategory);

        fetch(`/api/v1/shop/products?${params}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProducts(data.data);
                    setTotal(data.pagination.total);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, search, selectedCategory]);

    // Fetch favorites
    useEffect(() => {
        fetch('/api/v1/shop/favorites')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const favIds = new Set(data.data.map((f: any) => f.product?.id).filter(Boolean));
                    setFavorites(favIds as Set<string>);
                }
            })
            .catch(() => { }); // Ignore if not logged in
    }, []);

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
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
        message.success(t('addedToCart'));
    };

    const handleToggleFavorite = async (productId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const isFavorite = favorites.has(productId);

        try {
            if (isFavorite) {
                await fetch(`/api/v1/shop/favorites?product_id=${productId}`, { method: 'DELETE' });
                setFavorites(prev => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
                message.success(t('removedFromFavorites'));
            } else {
                await fetch('/api/v1/shop/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: productId }),
                });
                setFavorites(prev => new Set(prev).add(productId));
                message.success(t('addedToFavorites'));
            }
        } catch (error) {
            message.error(t('error'));
        }
    };

    const handleProductClick = (slug: string) => {
        router.push(`/${locale}/shop/${slug}`);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <div style={{ padding: '40px 24px', maxWidth: '1400px', margin: '0 auto' }}>
            <Title level={2}>{t('title')}</Title>
            <Paragraph type="secondary">{t('subtitle')}</Paragraph>

            {/* Filters */}
            <Row gutter={16} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} md={8}>
                    <Input
                        placeholder={t('searchPlaceholder')}
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Select
                        placeholder={t('allCategories')}
                        value={selectedCategory}
                        onChange={(value) => { setSelectedCategory(value); setPage(1); }}
                        allowClear
                        style={{ width: '100%' }}
                    >
                        {categories.map(cat => (
                            <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                        ))}
                    </Select>
                </Col>
            </Row>

            {/* Products Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Spin size="large" />
                </div>
            ) : products.length === 0 ? (
                <Empty description={t('noProducts')} />
            ) : (
                <>
                    <Row gutter={[24, 32]}>
                        {products.map(product => (
                            <Col xs={12} sm={12} md={8} lg={6} xl={4} key={product.id}>
                                <Badge.Ribbon
                                    text={t('featured')}
                                    color="gold"
                                    style={{ display: product.featured ? 'block' : 'none' }}
                                >
                                    <Card
                                        hoverable
                                        className="product-card"
                                        onClick={() => handleProductClick(product.slug)}
                                        cover={
                                            <div style={{
                                                height: '240px',
                                                background: '#f9f9f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                position: 'relative',
                                                borderRadius: '8px 8px 0 0'
                                            }}>
                                                {product.thumbnail_url ? (
                                                    <Image
                                                        src={product.thumbnail_url}
                                                        alt={product.name}
                                                        fill
                                                        sizes="(max-width: 576px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                                        priority={products.indexOf(product) < 4}
                                                        style={{
                                                            objectFit: 'cover',
                                                            transition: 'transform 0.3s ease'
                                                        }}
                                                        className="product-image"
                                                    />
                                                ) : (
                                                    <ShoppingCartOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                                                )}
                                            </div>
                                        }
                                        actions={[
                                            <Button
                                                key="cart"
                                                type="text"
                                                icon={<ShoppingCartOutlined />}
                                                onClick={(e) => handleAddToCart(product, e)}
                                                className="action-btn"
                                            >
                                                {t('addToCart')}
                                            </Button>,
                                            <Button
                                                key="favorite"
                                                type="text"
                                                icon={favorites.has(product.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                                onClick={(e) => handleToggleFavorite(product.id, e)}
                                                className="action-btn"
                                            />
                                        ]}
                                        style={{
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid #f0f0f0',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <Card.Meta
                                            title={<div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{product.name}</div>}
                                            description={
                                                <div>
                                                    <div style={{ height: '40px', overflow: 'hidden', marginBottom: '12px' }}>
                                                        <Text type="secondary" style={{ fontSize: '13px' }}>
                                                            {product.short_description || '-'}
                                                        </Text>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                        <div>
                                                            <div style={{ marginBottom: '4px' }}>
                                                                <Text strong style={{ fontSize: '20px', color: '#1677ff' }}>
                                                                    ${(product.price_cents / 100).toFixed(2)}
                                                                </Text>
                                                            </div>
                                                            {product.compare_at_price_cents && (
                                                                <Text delete type="secondary" style={{ fontSize: '12px' }}>
                                                                    ${(product.compare_at_price_cents / 100).toFixed(2)}
                                                                </Text>
                                                            )}
                                                        </div>
                                                        {product.category && (
                                                            <Tag color="blue" style={{ margin: 0, borderRadius: '4px' }}>
                                                                {product.category.name}
                                                            </Tag>
                                                        )}
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </Card>
                                </Badge.Ribbon>
                            </Col>
                        ))}
                    </Row>

                    <style jsx global>{`
                        .product-card:hover {
                            transform: translateY(-8px);
                            box-shadow: 0 12px 24px rgba(0,0,0,0.1) !important;
                        }
                        .product-card:hover .product-image {
                            transform: scale(1.05);
                        }
                        .action-btn:hover {
                            color: #1677ff !important;
                            background: rgba(22, 119, 255, 0.05) !important;
                        }
                    `}</style>

                    {/* Pagination */}
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Pagination
                            current={page}
                            total={total}
                            pageSize={pageSize}
                            onChange={setPage}
                            showSizeChanger={false}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
