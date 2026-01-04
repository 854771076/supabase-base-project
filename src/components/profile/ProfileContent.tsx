'use client';

import React from 'react';
import { Card, Descriptions, Avatar, Tag, Button, Typography, Space, Divider, Collapse } from 'antd';
import { UserOutlined, CodeOutlined, LogoutOutlined } from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface ProfileContentProps {
    user: User;
    session: Session | null;
    subscription: any;
    usage: any[];
}

export default function ProfileContent({ user, session, subscription, usage }: ProfileContentProps) {
    const t = useTranslations('Profile');
    const router = useRouter();
    const locale = useLocale();

    const items = [
        {
            key: '1',
            label: t('email'),
            children: (
                <Space>
                    {user.email}
                    {user.email_confirmed_at && <Tag color="success">Verified</Tag>}
                </Space>
            ),
        },
        {
            key: '2',
            label: t('userId'),
            children: <Text copyable>{user.id}</Text>,
        },
        {
            key: '3',
            label: t('lastSignIn'),
            children: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-',
        },
        {
            key: '4',
            label: t('subscription'),
            children: (
                <Space direction="vertical" size={0}>
                    <Space>
                        <Tag color={subscription?.plans?.name === 'Pro' ? 'gold' : 'blue'}>
                            {subscription?.plans?.name || 'Free'}
                        </Tag>
                        <Text type="secondary">
                            {subscription?.status === 'active' ? t('active') : t('inactive')}
                        </Text>
                    </Space>
                    {subscription?.current_period_end && (
                        <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            {t('expiresAt')}: {new Date(subscription.current_period_end).toLocaleDateString()}
                        </Text>
                    )}
                </Space>
            ),
        }
    ];

    const planFeatures = subscription?.plans?.features || {};
    const planQuotas = subscription?.plans?.quotas || {};

    const getUsage = (featureName: string) => {
        const record = usage.find(r => r.feature_name === featureName);
        return record?.usage_count || 0;
    };

    const formatQuota = (label: string, usageCount: number, limit: number) => {
        return t('quotaFormat')
            .replace('{usage}', usageCount.toString())
            .replace('{limit}', limit.toString())
            .replace('{label}', label);
    };

    const sessionItems = [
        {
            key: '1',
            label: <span><CodeOutlined /> {t('sessionDetails')}</span>,
            children: (
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    <Descriptions column={1} size="small" layout="vertical" bordered>
                        <Descriptions.Item label="Access Token">
                            <Text code copyable={{ text: session?.access_token }} style={{ wordBreak: 'break-all' }}>
                                {session?.access_token?.substring(0, 50)}...
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Refresh Token">
                            <Text code copyable={{ text: session?.refresh_token }} style={{ wordBreak: 'break-all' }}>
                                {session?.refresh_token?.substring(0, 50)}...
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            ),
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <Avatar size={64} icon={<UserOutlined />} src={user.user_metadata?.avatar_url} style={{ marginRight: '24px', backgroundColor: '#1677ff' }} />
                    <div style={{ flex: 1 }}>
                        <Title level={3} style={{ marginTop: 0, marginBottom: '4px' }}>
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </Title>
                        <Text type="secondary">{user.email}</Text>
                    </div>
                </div>

                <Divider />

                <Descriptions title={t('basicInfo')} bordered column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}>
                    {items.map(item => (
                        <Descriptions.Item key={item.key} label={item.label}>
                            {item.children}
                        </Descriptions.Item>
                    ))}
                </Descriptions>

                <div style={{ marginTop: '24px' }}>
                    <Title level={4}>{t('planFeatures')}</Title>
                    <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label={t('apiAccess')}>
                                {planFeatures.api_access ? <Tag color="success">{t('enabled')}</Tag> : <Tag>{t('disabled')}</Tag>}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('dailyRequests')}>
                                <Text strong>
                                    {formatQuota(t('used'), getUsage('api_request'), planQuotas.daily_requests || 0)}
                                </Text>
                            </Descriptions.Item>
                            {planFeatures.advanced_features && (
                                <Descriptions.Item label={t('advancedFeatures')}>
                                    <Tag color="success">{t('enabled')}</Tag>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <Collapse ghost items={sessionItems} />
                </div>

                <Divider />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <Button type="primary" ghost size="large" onClick={() => router.push(`/${locale}/pricing`)}>
                        {t('upgrade')}
                    </Button>
                    <form action="/auth/signout" method="post">
                        <Button type="primary" danger icon={<LogoutOutlined />} htmlType="submit" size="large">
                            {t('signOut')}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
