'use client';

import React, { use, useEffect, useState } from 'react';
import { Layout, Menu, Typography, Result, Spin, Button, Drawer } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    AppstoreOutlined,
    OrderedListOutlined,
    ArrowLeftOutlined,
    MenuOutlined
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
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Check if user is admin
        fetch('/api/v1/user')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setIsAdmin(data.is_admin === true);
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
            type: 'group' as const,
            label: t('products'),
            children: [
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
            ]
        },
        {
            type: 'group' as const,
            label: t('subscriptions'),
            children: [
                {
                    key: 'plans',
                    icon: <AppstoreOutlined />,
                    label: <Link href={`/${locale}/admin/plans`}>{t('plans')}</Link>,
                },
                {
                    key: 'subscriptions',
                    icon: <OrderedListOutlined />,
                    label: <Link href={`/${locale}/admin/subscriptions`}>{t('subscriptions')}</Link>,
                },
            ]
        },
        {
            type: 'group' as const,
            label: t('creditProducts'),
            children: [
                {
                    key: 'credit-products',
                    icon: <ShoppingOutlined />,
                    label: <Link href={`/${locale}/admin/credit-products`}>{t('creditProducts')}</Link>,
                },
                {
                    key: 'user-credits',
                    icon: <DashboardOutlined />,
                    label: <Link href={`/${locale}/admin/user-credits`}>{t('userCredits')}</Link>,
                },
            ]
        },
        {
            type: 'group' as const,
            label: t('orders'),
            children: [
                {
                    key: 'orders',
                    icon: <OrderedListOutlined />,
                    label: <Link href={`/${locale}/admin/orders`}>{t('orders')}</Link>,
                },
                {
                    key: 'licenses',
                    icon: <AppstoreOutlined />,
                    label: <Link href={`/${locale}/admin/licenses`}>{t('licenses')}</Link>,
                },
            ]
        },
        {
            key: 'logs',
            icon: <OrderedListOutlined />,
            label: <Link href={`/${locale}/admin/logs`}>{t('logs')}</Link>,
        },
    ];

    // Determine active menu key
    const getActiveKey = () => {
        if (pathname.includes('/products')) return 'products';
        if (pathname.includes('/categories')) return 'categories';
        if (pathname.includes('/orders')) return 'orders';
        if (pathname.includes('/plans')) return 'plans';
        if (pathname.includes('/subscriptions')) return 'subscriptions';
        if (pathname.includes('/credit-products')) return 'credit-products';
        if (pathname.includes('/user-credits')) return 'user-credits';
        if (pathname.includes('/licenses')) return 'licenses';
        if (pathname.includes('/logs')) return 'logs';
        return 'dashboard';
    };

    const SidebarContent = () => (
        <>
            <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 32, height: 32, background: '#1890ff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>A</div>
                <Title level={4} style={{ margin: 0 }}>{t('adminPanel')}</Title>
            </div>
            <Menu
                mode="inline"
                selectedKeys={[getActiveKey()]}
                items={menuItems}
                style={{ border: 'none' }}
                onClick={() => setMobileDrawerOpen(false)}
            />
            <div style={{ padding: '16px', marginTop: 'auto' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push(`/${locale}`)}
                    style={{ color: '#666' }}
                >
                    {t('backToSite')}
                </Button>
            </div>
        </>
    );

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
        <Layout style={{ minHeight: '100vh' }}>
            {!isMobile && (
                <Sider
                    width={250}
                    theme="light"
                    style={{
                        borderRight: '1px solid #f0f0f0',
                        background: '#fff',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <SidebarContent />
                </Sider>
            )}

            {isMobile && (
                <Drawer
                    placement="left"
                    onClose={() => setMobileDrawerOpen(false)}
                    open={mobileDrawerOpen}
                    width={250}
                    styles={{ body: { padding: 0 } }}
                >
                    <SidebarContent />
                </Drawer>
            )}

            <Layout style={{ marginLeft: isMobile ? 0 : 250, transition: 'all 0.2s' }}>
                {isMobile && (
                    <div style={{ padding: '16px', background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                        <Button icon={<MenuOutlined />} onClick={() => setMobileDrawerOpen(true)} />
                        <span style={{ marginLeft: '16px', fontWeight: 'bold' }}>{t('adminPanel')}</span>
                    </div>
                )}
                <Content style={{ padding: isMobile ? '12px' : '24px', background: '#f5f7fa', minHeight: '100vh' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}
