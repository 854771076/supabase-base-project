'use client';

import React, { useState } from 'react';
import { Card, Button, Typography, Space, Progress, Badge, App, Divider } from 'antd';
import { RocketOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Text, Paragraph } = Typography;

interface DemoClientProps {
    subscription: any;
    initialUsage: any[];
}

export default function DemoClient({ subscription, initialUsage }: DemoClientProps) {
    const t = useTranslations('Demo');
    const pt = useTranslations('Profile');
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [usage, setUsage] = useState(initialUsage);

    const planName = subscription?.plans?.name || 'Free';
    const planFeatures = subscription?.plans?.features || {};
    const planQuotas = subscription?.plans?.quotas || {};

    const apiRequestUsage = usage.find(r => r.feature_name === 'api_request')?.usage_count || 0;
    const apiRequestLimit = planQuotas.daily_requests || 0;
    const hasApiAccess = !!planFeatures.api_access;

    const handleSimulateRequest = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/demo/request', {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    message.error(t('upgradeRequired'));
                } else if (response.status === 429) {
                    message.warning(t('quotaExceeded'));
                } else {
                    throw new Error(data.error || 'Request failed');
                }
                return;
            }

            message.success(t('requestSuccess'));

            // Update local usage state
            setUsage(prev => {
                const index = prev.findIndex(r => r.feature_name === 'api_request');
                if (index > -1) {
                    const next = [...prev];
                    next[index] = { ...next[index], usage_count: data.currentUsage };
                    return next;
                }
                return [...prev, { feature_name: 'api_request', usage_count: data.currentUsage }];
            });
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const percent = Math.min(100, (apiRequestUsage / apiRequestLimit) * 100);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Title level={2}>{t('title')}</Title>
                    <Paragraph type="secondary">{t('subtitle')}</Paragraph>
                    <Badge count={planName} color={planName === 'Pro' ? 'gold' : 'blue'} offset={[10, 0]}>
                        <Text strong style={{ fontSize: '18px' }}>{pt('subscription')}</Text>
                    </Badge>
                </div>

                <Divider />

                <div style={{ marginBottom: '32px' }}>
                    <Title level={4}>
                        <Space>
                            <RocketOutlined />
                            {pt('apiAccess')}
                        </Space>
                    </Title>
                    <Card
                        size="small"
                        style={{
                            backgroundColor: hasApiAccess ? '#f6ffed' : '#fff1f0',
                            border: `1px solid ${hasApiAccess ? '#b7eb8f' : '#ffa39e'}`,
                            borderRadius: '8px'
                        }}
                    >
                        <Space>
                            {hasApiAccess ? (
                                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            ) : (
                                <LockOutlined style={{ color: '#ff4d4f' }} />
                            )}
                            <Text strong>
                                {hasApiAccess ? pt('enabled') : pt('disabled')}
                            </Text>
                        </Space>
                    </Card>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <Title level={4}>{pt('dailyRequests')}</Title>
                    <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <Text>{t('currentUsage')}: {apiRequestUsage}</Text>
                            <Text type="secondary">{t('limit')}: {apiRequestLimit}</Text>
                        </div>
                        <Progress
                            percent={percent}
                            status={apiRequestUsage >= apiRequestLimit ? 'exception' : 'active'}
                            strokeColor={percent > 80 ? '#faad14' : '#1677ff'}
                        />
                    </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <Button
                        type="primary"
                        size="large"
                        icon={<RocketOutlined />}
                        onClick={handleSimulateRequest}
                        loading={loading}
                        style={{ height: '56px', borderRadius: '28px', padding: '0 40px' }}
                    >
                        {t('simulateRequest')}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
