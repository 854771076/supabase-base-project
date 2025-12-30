'use client';

import React from 'react';
import { Card, Typography, Space } from 'antd';
import AuthForm from './AuthForm';

const { Title, Text } = Typography;

interface LoginContentProps {
    title: string;
    subtitle: string;
}

export default function LoginContent({ title, subtitle }: LoginContentProps) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '24px'
        }}>
            <Card
                style={{
                    maxWidth: 400,
                    width: '100%',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    borderRadius: '12px'
                }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
                    <div>
                        <Title level={2} style={{ marginBottom: 8 }}>{title}</Title>
                        <Text type="secondary">{subtitle}</Text>
                    </div>

                    <AuthForm />

                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        &copy; {new Date().getFullYear()} Supabase Project
                    </Text>
                </Space>
            </Card>
        </div>
    );
}
