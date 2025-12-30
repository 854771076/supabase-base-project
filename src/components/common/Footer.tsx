'use client';

import React from 'react';
import { Layout, Typography } from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

export default function Footer() {
    return (
        <AntFooter style={{ textAlign: 'center' }}>
            <Text type="secondary">
                Supabase Base Project ©{new Date().getFullYear()} Created with Next.js & Ant Design
            </Text>
        </AntFooter>
    );
}
