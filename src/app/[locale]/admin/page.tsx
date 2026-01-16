'use client';

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin } from 'antd';
import {
    ShoppingOutlined,
    AppstoreOutlined,
    OrderedListOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph } = Typography;

export default function AdminDashboard() {
    const t = useTranslations('Admin');
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        orders: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch stats
        Promise.all([
            fetch('/api/v1/shop/products?limit=1').then(r => r.json()),
            fetch('/api/v1/shop/categories').then(r => r.json()),
            fetch('/api/v1/admin/orders?limit=1').then(r => r.json()),
        ])
            .then(([products, categories, orders]) => {
                setStats({
                    products: products.pagination?.total || 0,
                    categories: categories.data?.length || 0,
                    orders: orders.pagination?.total || 0,
                    revenue: 0, // Would need a dedicated API for this
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            <Title level={3}>{t('dashboard')}</Title>
            <Paragraph type="secondary">{t('dashboardSubtitle')}</Paragraph>

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title={t('totalProducts')}
                            value={stats.products}
                            prefix={<ShoppingOutlined />}
                            valueStyle={{ color: '#1677ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title={t('totalCategories')}
                            value={stats.categories}
                            prefix={<AppstoreOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title={t('totalOrders')}
                            value={stats.orders}
                            prefix={<OrderedListOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title={t('revenue')}
                            value={stats.revenue}
                            prefix={<DollarOutlined />}
                            precision={2}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
