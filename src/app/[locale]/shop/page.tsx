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
                    <Row gutter={[24, 24]}>
                        {products.map(product => (
                            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                <Badge.Ribbon
                                    text={t('featured')}
                                    color="gold"
                                    style={{ display: product.featured ? 'block' : 'none' }}
                                >
                                    <Card
                                        hoverable
                                        onClick={() => handleProductClick(product.slug)}
                                        cover={
                                            <div style={{
                                                height: '200px',
                                                background: '#f5f5f5',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                position: 'relative'
                                            }}>
                                                {product.thumbnail_url ? (
                                                    <img
                                                        src={product.thumbnail_url}
                                                        alt={product.name}
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '100%',
                                                            objectFit: 'cover'
                                                        }}
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
                                            >
                                                {t('addToCart')}
                                            </Button>,
                                            <Button
                                                key="favorite"
                                                type="text"
                                                icon={favorites.has(product.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                                onClick={(e) => handleToggleFavorite(product.id, e)}
                                            />
                                        ]}
                                    >
                                        <Card.Meta
                                            title={product.name}
                                            description={
                                                <div>
                                                    {product.category && (
                                                        <Tag color="blue" style={{ marginBottom: '8px' }}>
                                                            {product.category.name}
                                                        </Tag>
                                                    )}
                                                    <div style={{ marginTop: '8px' }}>
                                                        <Text strong style={{ fontSize: '18px', color: '#1677ff' }}>
                                                            ${(product.price_cents / 100).toFixed(2)}
                                                        </Text>
                                                        {product.compare_at_price_cents && (
                                                            <Text delete type="secondary" style={{ marginLeft: '8px' }}>
                                                                ${(product.compare_at_price_cents / 100).toFixed(2)}
                                                            </Text>
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
