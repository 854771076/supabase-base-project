'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Typography, Button, Space, Row, Col, Card, Spin, Input, Divider, message } from 'antd';
import { ShoppingOutlined, ArrowRightOutlined, RocketOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import ProductCard from '@/components/shop/ProductCard';
import { Product, Category } from '@/components/shop/types';
import { useCart } from '@/components/cart/CartContext';
import styles from './HomeClient.module.css';

const { Title, Paragraph, Text } = Typography;

export default function HomeClient() {
    const t = useTranslations('Home');
    const tShop = useTranslations('Shop');

    const { addItem } = useCart();
    
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catsRes, prodsRes, favsRes] = await Promise.all([
                    fetch('/api/v1/shop/categories'),
                    fetch('/api/v1/shop/products?limit=8'), // Get 8 featured/latest products
                    fetch('/api/v1/shop/favorites')
                ]);

                const catsData = await catsRes.json();
                const prodsData = await prodsRes.json();
                const favsData = await favsRes.json();

                if (catsData.success) setCategories(catsData.data);
                if (prodsData.success) setFeaturedProducts(prodsData.data);
                if (favsData.success) {
                    const favIds = new Set(favsData.data.map((f: any) => f.product?.id).filter(Boolean));
                    setFavorites(favIds as Set<string>);
                }
            } catch (error) {
                console.error('Failed to fetch home data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        addItem({
            id: product.id,
            name: product.name,
            price_cents: product.min_price_cents ?? 0,
            type: 'product',
            metadata: { image: product.thumbnail_url },
        });
        message.success(tShop('addedToCart'));
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
                message.success(tShop('removedFromFavorites'));
            } else {
                await fetch('/api/v1/shop/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: productId }),
                });
                setFavorites(prev => new Set(prev).add(productId));
                message.success(tShop('addedToFavorites'));
            }
        } catch (error) {
            message.error(tShop('error'));
        }
    };

    return (
        <div className={styles.homeContainer}>
            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <Title className={styles.heroTitle}>
                        {t('heroTitle')} <br />
                        <span className={styles.highlight}>{t('heroTitleHighlight')}</span>
                    </Title>
                    <Paragraph className={styles.heroDesc}>
                        {t('heroDescription')}
                    </Paragraph>
                    <Link href="/shop">
                        <Button type="primary" size="large" icon={<ShoppingOutlined />} className={styles.heroBtn}>
                            {t('shopNow')}
                        </Button>
                    </Link>
                </div>
                {/* Decorative Elements */}
                <div className={styles.heroBlurC1} />
                <div className={styles.heroBlurC2} />
            </div>

            <div className={styles.contentWrapper}>
                {/* Categories Section */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Title level={2}>{t('popularCategories')}</Title>
                        <Link href="/shop">
                            <Button type="link" icon={<ArrowRightOutlined />}>{t('viewAll')}</Button>
                        </Link>
                    </div>

                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <Spin />
                        </div>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {categories.slice(0, 4).map(cat => (
                                <Col xs={24} sm={12} md={6} key={cat.id}>
                                    <Link href={`/shop?category_id=${cat.id}`}>
                                        <div className={styles.categoryCard}>
                                            <div className={styles.catIconWrapper}>
                                                <RocketOutlined style={{ fontSize: 24 }} />
                                            </div>
                                            <Title level={4} style={{ margin: 0 }}>{cat.name}</Title>
                                        </div>
                                    </Link>
                                </Col>
                            ))}
                        </Row>
                    )}
                </section>

                {/* Featured Products */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Title level={2}>{t('featuredProducts')}</Title>
                        <Paragraph type="secondary">{t('featuredSubtitle')}</Paragraph>
                    </div>

                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {featuredProducts.map(product => (
                                <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                                    <ProductCard
                                        product={product}
                                        isFavorite={favorites.has(product.id)}
                                        onAddToCart={handleAddToCart}
                                        onToggleFavorite={handleToggleFavorite}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}

                    <div style={{ textAlign: 'center', marginTop: 40 }}>
                        <Link href="/shop">
                            <Button size="large" className={styles.viewMoreBtn}>
                                {t('viewAllProducts')}
                            </Button>
                        </Link>
                    </div>
                </section>



            </div>

            {/* Newsletter (Static) */}
             <div className={styles.newsletterSection}>
                 <div className={styles.contentWrapper} style={{ textAlign: 'center' }}>
                    <Title level={3}>{t('newsletterTitle')}</Title>
                    <Paragraph type="secondary">{t('newsletterSubtitle')}</Paragraph>
                    <Space.Compact style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
                        <Input placeholder={t('emailPlaceholder')} size="large" />
                        <Button type="primary" size="large">{t('subscribe')}</Button>
                    </Space.Compact>
                 </div>
             </div>
        </div>
    );
}
