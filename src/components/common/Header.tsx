'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography, Drawer, Grid, Badge } from 'antd';
import { UserOutlined, GlobalOutlined, LogoutOutlined, DownOutlined, MenuOutlined, SwapOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from '@/i18n/context';
import { Locale } from '@/i18n/config';
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import NetworkSwitcher, { useNetworkMenuItems } from './NetworkSwitcher';
import { useCart } from '../cart/CartContext';
import CartDrawer from '../cart/CartDrawer';

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface HeaderProps {
    user: User | null;
}

export default function Header({ user }: HeaderProps) {
    const t = useTranslations('Nav');
    const currentLocale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const screens = useBreakpoint();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [cartVisible, setCartVisible] = useState(false);
    const { items: networkItems } = useNetworkMenuItems();
    const { itemCount } = useCart();

    const isMobile = screens.xs || (screens.sm && !screens.md);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh();
        setDrawerVisible(false);
    };

    const handleLanguageChange = ({ key }: { key: string }) => {
        window.location.href = `/${key}${pathname}`;
    };

    const languageMenu = {
        items: [
            { key: 'en', label: 'English' },
            { key: 'zh', label: '中文' },
        ],
        onClick: handleLanguageChange,
    };

    const userMenuItems = [
        {
            key: 'profile',
            label: (
                <Link href="/profile" onClick={() => setDrawerVisible(false)}>
                    {t('profile')}
                </Link>
            ),
            icon: <UserOutlined />,
        },
        {
            key: 'favorites',
            label: (
                <Link href="/favorites" onClick={() => setDrawerVisible(false)}>
                    {t('favorites')}
                </Link>
            ),
            icon: <UserOutlined />,
        },
        {
            key: 'orders',
            label: (
                <Link href="/orders" onClick={() => setDrawerVisible(false)}>
                    {t('orderHistory')}
                </Link>
            ),
            icon: <LogoutOutlined />,
        },
        ...(user?.app_metadata?.is_admin ? [{
            key: 'admin',
            label: (
                <Link href="/admin" onClick={() => setDrawerVisible(false)}>
                    {t('admin')}
                </Link>
            ),
            icon: <UserOutlined />,
        }] : []),
        {
            key: 'logout',
            label: t('logout'),
            icon: <LogoutOutlined />,
            onClick: handleLogout,
        },
    ];

    const menuItems = [
        {
            key: 'home',
            label: <Link href={`/${currentLocale}`} onClick={() => setDrawerVisible(false)}>{t('home')}</Link>,
        },
        {
            key: 'shop',
            label: <Link href={`/${currentLocale}/shop`} onClick={() => setDrawerVisible(false)}>{t('shop')}</Link>,
        },
        {
            key: 'pricing',
            label: <Link href={`/${currentLocale}/pricing`} onClick={() => setDrawerVisible(false)}>{t('pricing')}</Link>,
        },
        {
            key: 'docs',
            label: <Link href={`/${currentLocale}/api-docs`} onClick={() => setDrawerVisible(false)}>{t('apiDocs')}</Link>,
        },
        {
            key: 'demo',
            label: <Link href={`/${currentLocale}/dashboard/demo`} onClick={() => setDrawerVisible(false)}>{t('demo')}</Link>,
        },
        {
            key: 'credits',
            label: <Link href={`/${currentLocale}/credits`} onClick={() => setDrawerVisible(false)}>{t('credits')}</Link>,
        },
    ];

    const getActiveKey = () => {
        if (pathname === '/') return 'home';
        if (pathname.startsWith('/shop')) return 'shop';
        if (pathname.startsWith('/pricing')) return 'pricing';
        if (pathname.startsWith('/api-docs')) return 'docs';
        if (pathname.startsWith('/dashboard')) return 'demo';
        if (pathname.startsWith('/credits')) return 'credits';
        return '';
    };

    return (
        <AntHeader
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                padding: isMobile ? '0 16px' : '0 50px',
                boxShadow: '0 2px 8px #f0f1f2'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Link href="/" style={{ marginRight: isMobile ? '12px' : '24px', fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold', color: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    ⚡ {isMobile ? 'Supabase' : 'Supabase Project'}
                </Link>
                {!isMobile && (
                    <Menu
                        mode="horizontal"
                        selectedKeys={[getActiveKey()]}
                        items={menuItems}
                        style={{ borderBottom: 'none', flex: 1, minWidth: 0 }}
                    />
                )}
            </div>

            <Space size={isMobile ? "small" : "middle"}>
                <Badge count={itemCount} size="small" offset={[-2, 4]}>
                    <Button
                        type="text"
                        icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />}
                        onClick={() => setCartVisible(true)}
                    />
                </Badge>
                {!isMobile ? (
                    <>
                        <Dropdown menu={languageMenu} placement="bottomRight">
                            <Button type="text" icon={<GlobalOutlined />}>
                                {t('language')}
                            </Button>
                        </Dropdown>

                        <NetworkSwitcher />

                        {user ? (
                            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                                <Space align="center" style={{ cursor: 'pointer', display: 'flex', minWidth: 0 }}>
                                    <Avatar size="small" icon={<UserOutlined />} src={user.user_metadata?.avatar_url} />
                                    <Text style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</Text>
                                    <DownOutlined style={{ fontSize: '10px' }} />
                                </Space>
                            </Dropdown>
                        ) : (
                            <Link href="/login">
                                <Button type="primary">{t('login')}</Button>
                            </Link>
                        )}
                    </>
                ) : (
                    <>
                        <Button
                            type="text"
                            icon={<MenuOutlined style={{ fontSize: '20px' }} />}
                            onClick={() => setDrawerVisible(true)}
                        />
                        <Drawer
                            title={t("menu")}
                            placement="right"
                            onClose={() => setDrawerVisible(false)}
                            open={drawerVisible}
                            width={280}
                        >
                            <Menu
                                mode="inline"
                                selectedKeys={[getActiveKey()]}
                                items={[
                                    ...menuItems,
                                    { type: 'divider' as const },
                                    {
                                        key: 'language',
                                        label: 'Language',
                                        icon: <GlobalOutlined />,
                                        children: [
                                            { key: 'en', label: 'English', onClick: () => handleLanguageChange({ key: 'en' }) },
                                            { key: 'zh', label: '中文', onClick: () => handleLanguageChange({ key: 'zh' }) },
                                        ]
                                    },
                                    {
                                        key: 'network',
                                        label: t('network'),
                                        icon: <SwapOutlined />,
                                        children: networkItems
                                    },
                                    ...(user ? [
                                        { type: 'divider' as const },
                                        ...userMenuItems
                                    ] : [
                                        { type: 'divider' as const },
                                        {
                                            key: 'login',
                                            label: <Link href="/login" onClick={() => setDrawerVisible(false)}>{t('login')}</Link>,
                                            icon: <UserOutlined />,
                                        }
                                    ])
                                ]}
                                style={{ borderRight: 'none' }}
                            />
                        </Drawer>
                    </>
                )}
            </Space>
            <CartDrawer
                open={cartVisible}
                onClose={() => setCartVisible(false)}
                locale={currentLocale}
            />
        </AntHeader>
    );
}
