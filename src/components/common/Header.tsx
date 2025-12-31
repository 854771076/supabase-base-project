'use client';

import React from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography } from 'antd';
import { UserOutlined, GlobalOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Locale } from '@/i18n/config';
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
    user: User | null;
}

export default function Header({ user }: HeaderProps) {
    const t = useTranslations('Nav');
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh();
    };

    const handleLanguageChange = ({ key }: { key: string }) => {
        router.replace(pathname, { locale: key as Locale });
    };

    const languageMenu = {
        items: [
            { key: 'en', label: 'English' },
            { key: 'zh', label: '中文' },
        ],
        onClick: handleLanguageChange,
    };

    const userMenu = {
        items: [
            {
                key: 'profile',
                label: (
                    <Link href="/profile">
                        {t('profile')}
                    </Link>
                ),
                icon: <UserOutlined />,
            },
            {
                key: 'logout',
                label: t('logout'),
                icon: <LogoutOutlined />,
                onClick: handleLogout,
            },
        ],
    };

    const menuItems = [
        {
            key: 'home',
            label: <Link href="/">Home</Link>,
        },
        {
            key: 'docs',
            label: <Link href="/api-docs">{t('apiDocs')}</Link>,
        },
    ];

    return (
        <AntHeader
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                boxShadow: '0 2px 8px #f0f1f2'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Link href="/" style={{ marginRight: '24px', fontSize: '18px', fontWeight: 'bold', color: 'inherit', textDecoration: 'none' }}>
                    ⚡ Supabase Project
                </Link>
                <Menu
                    mode="horizontal"
                    selectedKeys={[pathname === '/' ? 'home' : pathname.replace('/', '')]}
                    items={menuItems}
                    style={{ borderBottom: 'none', minWidth: '300px' }}
                />
            </div>

            <Space size="middle">
                <Dropdown menu={languageMenu} placement="bottomRight">
                    <Button type="text" icon={<GlobalOutlined />}>
                        Language
                    </Button>
                </Dropdown>

                {user ? (
                    <Dropdown menu={userMenu} placement="bottomRight">
                        <Space style={{ cursor: 'pointer' }}>
                            <Avatar icon={<UserOutlined />} src={user.user_metadata?.avatar_url} />
                            <Text strong>{user.email}</Text>
                            <DownOutlined style={{ fontSize: '10px' }} />
                        </Space>
                    </Dropdown>
                ) : (
                    <Link href="/login">
                        <Button type="primary">{t('login')}</Button>
                    </Link>
                )}
            </Space>
        </AntHeader>
    );
}
