'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Typography, Button, Space, Row, Col, Card, Spin, Input, Divider, message } from 'antd';
import { ShoppingOutlined, ArrowRightOutlined, RocketOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import ProductCard from '@/components/shop/ProductCard';
import { Product, Category } from '@/components/shop/types';
import { useCart } from '@/components/cart/CartContext';

const { Title, Paragraph, Text } = Typography;

export default function HomeClient() {
    const t = useTranslations('Index'); // You might want to create a new 'Home' namespace later, but 'Index' is fine for now if we add keys? Or fallback to hardcoded for now and ask user to update json. 
    // Actually, I should probably use 'Shop' or 'Index' and maybe some hardcoded text if keys are missing, but I'll try to use generic keys or 'Shop' namespace where possible.
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
            price_cents: product.price_cents,
            type: 'product',
            metadata: { image: product.thumbnail_url, slug: product.slug },
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
        <div className="home-container">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <Title className="hero-title">
                        ShineYouny <br />
                        <span className="highlight">Beauty</span>
                    </Title>
                    <Paragraph className="hero-desc">
                        {t('heroDescription') || "Discover your natural radiance with our curated collection of premium skincare and beauty essentials. Elevate your daily ritual with products designed to make you shine from within."}
                    </Paragraph>
                    <Link href="/shop">
                        <Button type="primary" size="large" icon={<ShoppingOutlined />} className="hero-btn">
                            Shop Now
                        </Button>
                    </Link>
                </div>
                {/* Decorative Elements */}
                <div className="hero-blur-c1" />
                <div className="hero-blur-c2" />
            </div>

            <div className="content-wrapper">
                {/* Categories Section */}
                <section className="section categories-section">
                    <div className="section-header">
                        <Title level={2}>Popular Categories</Title>
                        <Link href="/shop">
                            <Button type="link" icon={<ArrowRightOutlined />}>View All</Button>
                        </Link>
                    </div>
                    
                    {loading ? <Spin /> : (
                        <Row gutter={[24, 24]}>
                            {categories.slice(0, 4).map(cat => (
                                <Col xs={24} sm={12} md={6} key={cat.id}>
                                    <Link href={`/shop?category_id=${cat.id}`}>
                                        <div className="category-card">
                                            <div className="cat-icon-wrapper">
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
                <section className="section featured-section">
                    <div className="section-header">
                        <Title level={2}>Featured Products</Title>
                        <Paragraph type="secondary">Hand-picked best sellers just for you</Paragraph>
                    </div>

                    {loading ? <div style={{textAlign: 'center', padding: 40}}><Spin size="large" /></div> : (
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
                            <Button size="large" className="view-more-btn">
                                View All Products
                            </Button>
                        </Link>
                    </div>
                </section>

                

            </div>

            {/* Newsletter (Static) */}
             <div className="newsletter-section">
                 <div className="content-wrapper" style={{ textAlign: 'center' }}>
                    <Title level={3}>Join our Newsletter</Title>
                    <Paragraph type="secondary">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</Paragraph>
                    <Space.Compact style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
                        <Input placeholder="Enter your email" size="large" />
                        <Button type="primary" size="large">Subscribe</Button>
                    </Space.Compact>
                 </div>
             </div>

             <style jsx global>{`
                .home-container {
                    background: #fff;
                }
                .hero-section {
                    position: relative;
                    padding: 80px 24px;
                    text-align: center;
                    background: radial-gradient(circle at 50% 50%, #f9f9f9, #ffffff);
                    overflow: hidden;
                    min-height: 500px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .hero-content {
                    position: relative;
                    z-index: 10;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .hero-title {
                    font-size: 56px !important;
                    font-weight: 800 !important;
                    margin-bottom: 24px !important;
                    line-height: 1.1 !important;
                }
                .hero-desc {
                    font-size: 20px !important;
                    color: #666;
                    margin-bottom: 32px !important;
                }
                .highlight {
                    background: linear-gradient(90deg, #1677ff, #00b96b);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hero-btn {
                    height: 48px;
                    padding: 0 40px;
                    font-size: 18px;
                    border-radius: 24px;
                }
                .hero-blur-c1, .hero-blur-c2 {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.5;
                }
                .hero-blur-c1 {
                    width: 300px;
                    height: 300px;
                    background: #e6f7ff;
                    top: -50px;
                    left: 10%;
                }
                .hero-blur-c2 {
                    width: 350px;
                    height: 350px;
                    background: #f6ffed;
                    bottom: -50px;
                    right: 15%;
                }

                .content-wrapper {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                }
                .section {
                    margin-bottom: 100px;
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }
                
                .category-card {
                    background: #fdfdfd;
                    border: 1px solid #f0f0f0;
                    border-radius: 16px;
                    padding: 32px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .category-card:hover {
                    border-color: #1677ff;
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                }
                .cat-icon-wrapper {
                    width: 64px;
                    height: 64px;
                    background: #e6f7ff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: #1677ff;
                }

                .promo-banner {
                    background: linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%);
                    border-radius: 24px;
                    padding: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                    overflow: hidden;
                }
                .promo-content {
                    position: relative;
                    z-index: 1;
                    max-width: 600px;
                }
                .promo-banner::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05));
                    transform: skewX(-20deg);
                }

                .newsletter-section {
                    background: #f9f9f9;
                    padding: 80px 24px;
                    border-top: 1px solid #f0f0f0;
                }

                @media (max-width: 768px) {
                    .hero-title { font-size: 36px !important; }
                    .hero-desc { font-size: 16px !important; }
                    .promo-banner { padding: 32px; }
                }
             `}</style>
        </div>
    );
}
