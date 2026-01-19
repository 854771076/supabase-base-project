'use client';

import React, { use, useEffect, useState } from 'react';
import { Layout, Menu, Typography, Result, Spin, Button } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    AppstoreOutlined,
    OrderedListOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const { Sider, Content } = Layout;
const { Title } = Typography;

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const t = useTranslations('Admin');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is super admin
        fetch('/api/v1/user')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.user) {
                    setIsAdmin(data.user.app_metadata?.is_admin === true);
                } else {
                    setIsAdmin(false);
                }
            })
            .catch(() => setIsAdmin(false))
            .finally(() => setLoading(false));
    }, []);

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: <Link href={`/${locale}/admin`}>{t('dashboard')}</Link>,
        },
        {
            key: 'products',
            icon: <ShoppingOutlined />,
            label: <Link href={`/${locale}/admin/products`}>{t('products')}</Link>,
        },
        {
            key: 'categories',
            icon: <AppstoreOutlined />,
            label: <Link href={`/${locale}/admin/categories`}>{t('categories')}</Link>,
        },
        {
            key: 'orders',
            icon: <OrderedListOutlined />,
            label: <Link href={`/${locale}/admin/orders`}>{t('orders')}</Link>,
        },
    ];

    // Determine active menu key
    const getActiveKey = () => {
        if (pathname.includes('/products')) return 'products';
        if (pathname.includes('/categories')) return 'categories';
        if (pathname.includes('/orders')) return 'orders';
        return 'dashboard';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div style={{ padding: '80px 24px' }}>
                <Result
                    status="403"
                    title={t('accessDenied')}
                    subTitle={t('adminOnly')}
                    extra={
                        <Button type="primary" onClick={() => router.push(`/${locale}`)}>
                            {t('backHome')}
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <Layout style={{ minHeight: 'calc(100vh - 180px)' }}>
            <Sider
                width={220}
                theme="light"
                style={{
                    borderRight: '1px solid #f0f0f0',
                    background: '#fff'
                }}
            >
                <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <Title level={4} style={{ margin: 0 }}>{t('adminPanel')}</Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getActiveKey()]}
                    items={menuItems}
                    style={{ border: 'none' }}
                />
                <div style={{ padding: '16px' }}>
                    <Button
                        type="link"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.push(`/${locale}`)}
                    >
                        {t('backToSite')}
                    </Button>
                </div>
            </Sider>
            <Content style={{ padding: '24px', background: '#f5f5f5' }}>
                {children}
            </Content>
        </Layout>
    );
}
