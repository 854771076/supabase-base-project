'use client';

import React, { use } from 'react';
import ProductDetailClient from '@/components/shop/ProductDetailClient';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
    const { id } = use(params);
    return <ProductDetailClient id={id} />;
}