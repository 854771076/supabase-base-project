'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Spin, Empty, Pagination, App } from 'antd';
import { useTranslations } from '@/i18n/context';
import { useCart } from '@/components/cart/CartContext';
import { debounce } from 'lodash';
import { Product, Category } from './types';
import FilterBar from './FilterBar';
import ProductCard from './ProductCard';

const { Title, Paragraph } = Typography;

export default function ShopListClient() {
    const t = useTranslations('Shop');
    const { addItem } = useCart();
    const { message } = App.useApp();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 12;

    useEffect(() => {
        fetch('/api/v1/shop/categories')
            .then(res => res.json())
            .then(data => {
                if (data.success) setCategories(data.data);
            })
            .catch(console.error);
    }, []);

    const fetchProducts = async (searchVal: string, catId: string | null, currentPage: number) => {
        setLoading(true);
        const params = new URLSearchParams({
            limit: pageSize.toString(),
            offset: ((currentPage - 1) * pageSize).toString(),
        });

        if (searchVal) params.set('search', searchVal);
        if (catId) params.set('category_id', catId);

        try {
            const res = await fetch(`/api/v1/shop/products?${params}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetch = useCallback(
        debounce((searchVal: string, catId: string | null, currentPage: number) => {
            fetchProducts(searchVal, catId, currentPage);
        }, 500),
        []
    );

    useEffect(() => {
        debouncedFetch(search, selectedCategory, page);
    }, [search, selectedCategory, page, debouncedFetch]);

    useEffect(() => {
        fetch('/api/v1/shop/favorites')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const favIds = new Set(data.data.map((f: any) => f.product?.id).filter(Boolean));
                    setFavorites(favIds as Set<string>);
                }
            })
            .catch(() => { });
    }, []);

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        addItem({
            id: product.id,
            name: product.name,
            price_cents: product.price_cents,
            type: 'product',
            metadata: { image: product.thumbnail_url, slug: product.slug },
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

    return (
        <div className="shop-container">
            <header className="shop-header">
                <Title level={1} style={{ marginBottom: 8, letterSpacing: '-1px' }}>{t('title')}</Title>
                <Paragraph type="secondary" style={{ fontSize: 16 }}>{t('subtitle')}</Paragraph>
            </header>

            <FilterBar
                search={search}
                onSearchChange={(val) => { setSearch(val); setPage(1); }}
                selectedCategory={selectedCategory}
                onCategoryChange={(val) => { setSelectedCategory(val); setPage(1); }}
                categories={categories}
            />

            {loading ? (
                <div className="loading-state">
                    <Spin size="large" tip={t('loading')} />
                </div>
            ) : products.length === 0 ? (
                <Empty className="empty-state" description={<span>{t('noProducts')}</span>} />
            ) : (
                <>
                    <Row gutter={[{ xs: 12, sm: 20, md: 24 }, { xs: 16, sm: 24, md: 32 }]}>
                        {products.map(product => (
                            <Col xs={12} sm={12} md={8} lg={6} xl={6} xxl={4} key={product.id}>
                                <ProductCard
                                    product={product}
                                    isFavorite={favorites.has(product.id)}
                                    onAddToCart={handleAddToCart}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            </Col>
                        ))}
                    </Row>

                    <div className="pagination-wrapper">
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

            <style jsx global>{`
                .shop-container {
                    padding: 40px 24px;
                    max-width: 1400px;
                    margin: 0 auto;
                    min-height: 100vh;
                    width: 100%;
                }
                .shop-header { margin-bottom: 32px; }
                .filter-bar {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    padding: 24px;
                    border-radius: 20px;
                    margin-bottom: 48px;
                    border: 1px solid rgba(240, 242, 245, 0.8);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                }
                .custom-search, .custom-select .ant-select-selector {
                    border-radius: 12px !important;
                    border: 1px solid #e8e8e8 !important;
                }
                .product-card {
                    border-radius: 16px !important;
                    overflow: hidden;
                    border: 1px solid #f0f0f0 !important;
                    height: 100%;
                    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important;
                }
                .product-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important;
                }
                .image-wrapper {
                    height: 280px;
                    background: #f9f9f9;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .product-image {
                    object-fit: cover;
                    transition: transform 0.6s ease !important;
                }
                .product-card:hover .product-image { transform: scale(1.1); }
                .hover-actions {
                    position: absolute;
                    bottom: -70px;
                    left: 0;
                    right: 0;
                    height: 80px;
                    background: linear-gradient(to top, rgba(255,255,255,0.9), transparent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: bottom 0.3s ease;
                }
                .product-card:hover .hover-actions { bottom: 0; }
                .placeholder-icon { font-size: 48px; color: #d9d9d9; }
                .card-content { padding: 4px 0; }
                .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .category-tag { font-size: 11px; text-transform: uppercase; color: #8c8c8c; letter-spacing: 1px; font-weight: 600; }
                .product-title {
                    margin: 0 0 12px 0 !important;
                    font-size: 16px !important;
                    height: 44px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    line-height: 1.4 !important;
                }
                .price-section { display: flex; align-items: baseline; gap: 8px; }
                .current-price { font-size: 18px; font-weight: 700; color: #1a1a1a; }
                .old-price { font-size: 14px; color: #bfbfbf; }
                .loading-state { padding: 100px 0; text-align: center; }
                .pagination-wrapper {
                    margin-top: 64px;
                    padding-top: 32px;
                    border-top: 1px solid #f0f0f0;
                    display: flex;
                    justify-content: center;
                }
                @media (max-width: 576px) {
                    .image-wrapper { height: 200px; }
                    .shop-container { padding: 20px 16px; }
                    .product-title { font-size: 14px !important; }
                }
            `}</style>
        </div>
    );
}
