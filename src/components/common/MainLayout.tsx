'use client';

import React from 'react';
import { Layout } from 'antd';
import Header from './Header';
import Footer from './Footer';
import type { User } from '@supabase/supabase-js';

const { Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
    user: User | null;
}

export default function MainLayout({ children, user }: MainLayoutProps) {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header user={user} />
            <Content style={{ display: 'flex', flexDirection: 'column' }}>
                {children}
            </Content>
            <Footer />
        </Layout>
    );
}
