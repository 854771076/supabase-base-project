'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Skeleton, Breadcrumb, Button, Typography, App } from 'antd';
import { HomeOutlined, ArrowLeftOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Product, ProductVariant } from './types';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';

const { Text } = Typography;

interface ProductDetailClientProps {
    id: string;
}

export default function ProductDetailClient({ id }: ProductDetailClientProps) {
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
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    useEffect(() => {
        let isMounted = true;
        fetch(`/api/v1/shop/products/${id}`)
            .then(res => res.json())
            .then(data => {
                if (isMounted) {
                    if (data.success) {
                        setProduct(data.data);

                        // Initialize variant selection if product has variants
                        if (data.data.variants?.length > 0) {
                            // Pre-select first available variant
                            const firstAvailableVariant = data.data.variants.find(
                                (v: ProductVariant) => v.is_active && v.stock_quantity > 0
                            ) || data.data.variants[0];

                            if (firstAvailableVariant) {
                                setSelectedAttributes(firstAvailableVariant.attributes);
                                setSelectedVariant(firstAvailableVariant);
                            }
                        }
                    } else {
                        router.push(`/${locale}/shop`);
                    }
                }
            })
            .catch(console.error)
            .finally(() => isMounted && setLoading(false));
        return () => { isMounted = false; };
    }, [id, locale, router]);

    useEffect(() => {
        if (!product) return;
        fetch('/api/v1/shop/favorites')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const favIds = data.data.map((f: any) => f.product?.id);
                    setIsFavorite(favIds.includes(product.id));
                }
            })
            .catch(() => { });
    }, [product]);

    // Update selected variant when attributes change
    useEffect(() => {
        if (!product?.variants?.length) return;

        const matchingVariant = product.variants.find(variant => {
            return Object.entries(selectedAttributes).every(
                ([key, value]) => variant.attributes[key] === value
            );
        });

        setSelectedVariant(matchingVariant || null);
    }, [selectedAttributes, product]);

    const handleAttributeChange = (optionName: string, value: string) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [optionName]: value,
        }));
    };

    const handleAddToCart = () => {
        if (!product) return;

        // Check if product has variants and if one is selected
        if ((product.variants?.length ?? 0) > 0) {
            if (!selectedVariant) {
                message.warning(t('pleaseSelectVariant') || 'Please select all options');
                return;
            }

            if (selectedVariant.stock_quantity < quantity) {
                message.warning(t('insufficientStock') || 'Insufficient stock');
                return;
            }

            // Add variant to cart
            for (let i = 0; i < quantity; i++) {
                addItem({
                    id: selectedVariant.id,
                    name: `${product.name} - ${selectedVariant.variant_name || Object.values(selectedVariant.attributes).join(' / ')}`,
                    price_cents: selectedVariant.price_cents,
                    type: 'product',
                    metadata: {
                        image: selectedVariant.thumbnail_url || product.thumbnail_url,
                        slug: product.slug,
                        product_id: product.id,
                        variant_id: selectedVariant.id,
                        attributes: selectedVariant.attributes,
                    },
                });
            }
        } else {
            // Add regular product to cart
            for (let i = 0; i < quantity; i++) {
                addItem({
                    id: product.id,
                    name: product.name,
                    price_cents: product.min_price_cents ?? 0,
                    type: 'product',
                    metadata: {
                        image: product.thumbnail_url,
                        slug: product.slug,
                    },
                });
            }
        }

        message.success({
            content: tCart('addedToCart'),
            icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
        });
    };

    const handleToggleFavorite = async () => {
        if (!product) return;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            message.warning(t('unauthorizedFavorite'));
            return;
        }

        const originalState = isFavorite;
        setIsFavorite(!originalState);

        try {
            if (originalState) {
                await fetch(`/api/v1/shop/favorites?product_id=${product.id}`, { method: 'DELETE' });
                message.success(t('removedFromFavorites'));
            } else {
                await fetch('/api/v1/shop/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: product.id }),
                });
                message.success(t('addedToFavorites'));
            }
        } catch (error) {
            setIsFavorite(originalState);
            message.error(t('error'));
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <Row gutter={[48, 48]}>
                    <Col xs={24} md={12}><Skeleton active paragraph={{ width: '100%', rows: 12 }} /></Col>
                    <Col xs={24} md={12}><Skeleton active paragraph={{ width: '100%', rows: 12 }} /></Col>
                </Row>
            </div>
        );
    }

    if (!product) return null;

    const images: string[] = selectedVariant?.images?.length
        ? selectedVariant.images
        : (product.thumbnail_url ? [product.thumbnail_url] : []);

    // Price/stock come from selected variant; fall back to min price from API
    const displayPrice = selectedVariant
        ? selectedVariant.price_cents
        : product.min_price_cents;

    const displayComparePrice = selectedVariant
        ? selectedVariant.compare_at_price_cents
        : product.min_compare_at_price_cents;

    const displayStock = selectedVariant
        ? selectedVariant.stock_quantity
        : product.total_stock_quantity;

    return (
        <div className="product-detail-container">
            <div className="nav-header">
                <Breadcrumb
                    items={[
                        { title: <Link href={`/${locale}`}><HomeOutlined /></Link> },
                        { title: <Link href={`/${locale}/shop`}>{t('title')}</Link> },
                        { title: <Text type="secondary" ellipsis style={{ maxWidth: 150 }}>{product.name}</Text> },
                    ]}
                />
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                    className="back-button"
                >
                    {t('backToShop')}
                </Button>
            </div>

            <Row gutter={[64, 48]}>
                <Col xs={24} md={12}>
                    <ProductGallery images={images} productName={product.name} />
                </Col>
                <Col xs={24} md={12}>
                    <ProductInfo
                        product={product}
                        price={displayPrice}
                        comparePrice={displayComparePrice}
                        stock={displayStock}
                        quantity={quantity}
                        onQuantityChange={(v) => setQuantity(v || 1)}
                        isFavorite={isFavorite}
                        onToggleFavorite={handleToggleFavorite}
                        onAddToCart={handleAddToCart}
                        selectedAttributes={selectedAttributes}
                        selectedVariant={selectedVariant}
                        onAttributeChange={handleAttributeChange}
                    />
                </Col>
            </Row>

            <style jsx global>{`
                .product-detail-container {
                    padding: 40px 24px;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                }
                .nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .product-title { font-size: clamp(24px, 3.5vw, 36px) !important; font-weight: 800 !important; margin-bottom: 8px !important; letter-spacing: -0.5px; }
                .custom-tag { border-radius: 6px; padding: 2px 10px; font-weight: 500; }
                .meta-info { margin-bottom: 24px; color: #8c8c8c; }
                .short-desc { font-size: 16px; color: #595959; line-height: 1.8; margin-bottom: 32px; }
                .main-carousel-wrapper { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.06); border: 1px solid #f0f0f0; }
                .image-slide { aspect-ratio: 1/1; display: flex !important; align-items: center; justify-content: center; }
                .image-slide img { width: 100%; height: 100%; object-fit: contain; }
                .thumbnails-wrapper { display: flex; gap: 12px; margin-top: 16px; overflow-x: auto; padding-bottom: 8px; }
                .thumb-item { width: 72px; height: 72px; border-radius: 12px; cursor: pointer; border: 2px solid transparent; overflow: hidden; transition: all 0.2s; flex-shrink: 0; }
                .thumb-item img { width: 100%; height: 100%; object-fit: cover; }
                .thumb-item:hover { border-color: #d9d9d9; }
                .thumb-item.active { border-color: #1677ff; }
                .purchase-card { background: #fcfcfc; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); border: 1px solid #f0f0f0; }
                .current-price { font-size: 42px; font-weight: 800; color: #1a1a1a; display: block; }
                .old-price { font-size: 18px; }
                .discount-tag { font-weight: 700; border: none; margin-left: 8px; }
                .quantity-selector { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .custom-input-number { width: 120px; border-radius: 10px; }
                .action-buttons { display: flex; gap: 12px; }
                .add-to-cart-btn { flex: 1; height: 54px !important; border-radius: 14px !important; font-weight: 600 !important; font-size: 16px !important; box-shadow: 0 8px 16px rgba(22,119,255,0.2) !important; }
                .fav-btn-custom {
                    width: 54px; height: 54px; border-radius: 14px;
                    border: 1.5px solid #f0f0f0; background: #fff;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: #bfbfbf;
                    transition: all 0.2s cubic-bezier(.34,1.56,.64,1);
                    flex-shrink: 0;
                }
                .fav-btn-custom:hover { border-color: #ff4d4f; color: #ff4d4f; transform: scale(1.08); background: #fff0f0; }
                .fav-btn-custom.fav-active { border-color: #ff4d4f; background: #fff0f0; color: #ff4d4f; }
                .fav-btn-custom.fav-active:hover { transform: scale(1.12); }
                .full-description { margin-top: 48px; padding-top: 32px; border-top: 1px solid #f0f0f0; }
                @media (max-width: 768px) {
                    .action-buttons { flex-direction: column; }
                    .add-to-cart-btn { width: 100% !important; }
                    .fav-btn-custom { width: 100%; }
                    .product-detail-container { padding: 20px 16px; }
                }
            `}</style>
        </div>
    );
}
