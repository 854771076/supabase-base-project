'use client';

import React from 'react';
import {
    Card, Descriptions, Avatar, Tag, Button, Typography,
    Space, Divider, Collapse, Row, Col, Progress, Statistic, Tooltip
} from 'antd';
import {
    UserOutlined, CodeOutlined, LogoutOutlined,
    RocketOutlined, CrownOutlined, WalletOutlined,
    CheckCircleFilled, InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import UserLicenses from './UserLicenses';

const { Title, Text, Paragraph } = Typography;

interface ProfileContentProps {
    user: User;
    session: Session | null;
    subscription: any;
    usage: any[];
    creditsBalance: number;
}

export default function ProfileContent({ user, session, subscription, usage, creditsBalance }: ProfileContentProps) {
    const t = useTranslations('Profile');
    const router = useRouter();
    const locale = useLocale();

    // 状态配置
    const isPro = subscription?.plans?.name === 'Pro';
    const apiUsage = usage.find(r => r.feature_name === 'api_request')?.usage_count || 0;
    const apiLimit = subscription?.plans?.quotas?.daily_requests || 0;
    const usagePercent = apiLimit > 0 ? Math.round((apiUsage / apiLimit) * 100) : 0;

    return (
        <div style={{ padding: 'clamp(12px, 5vw, 40px)', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* 顶部个人资料卡片 */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: '20px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                        marginBottom: '24px',
                        overflow: 'hidden'
                    }}
                    bodyStyle={{ padding: '32px' }}
                >
                    <Row gutter={[24, 24]} align="middle">
                        <Col xs={24} sm={4}>
                            <Avatar
                                size={88}
                                icon={<UserOutlined />}
                                src={user.user_metadata?.avatar_url}
                                style={{
                                    backgroundColor: '#1677ff',
                                    boxShadow: '0 4px 10px rgba(22, 119, 255, 0.3)',
                                    border: '4px solid #fff'
                                }}
                            />
                        </Col>
                        <Col xs={24} sm={14}>
                            <Space direction="vertical" size={0}>
                                <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                    {isPro && <CrownOutlined style={{ color: '#faad14', fontSize: '20px' }} />}
                                </Title>
                                <Text type="secondary" style={{ fontSize: '16px' }}>{user.email}</Text>
                                <Space style={{ marginTop: '8px' }}>
                                    {user.email_confirmed_at ? (
                                        <Tag color="success" icon={<CheckCircleFilled />}>Verified</Tag>
                                    ) : (
                                        <Tag>Unverified</Tag>
                                    )}
                                    <Tag bordered={false}>UID: {user.id.slice(0, 8)}</Tag>
                                </Space>
                            </Space>
                        </Col>
                        <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
                            <form action="/auth/signout" method="post">
                                <Button block type="text" danger icon={<LogoutOutlined />} htmlType="submit">
                                    {t('signOut')}
                                </Button>
                            </form>
                        </Col>
                    </Row>
                </Card>

                <Row gutter={[24, 24]}>
                    {/* 左侧：账户与配额 */}
                    <Col xs={24} md={15}>
                        <Space direction="vertical" size={24} style={{ width: '100%' }}>

                            {/* 配额可视化 */}
                            <Card title={<Space><RocketOutlined />{t('planFeatures')}</Space>} bordered={false} style={{ borderRadius: '16px' }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <Text strong>{t('dailyRequests')}</Text>
                                        <Text type="secondary">{apiUsage} / {apiLimit}</Text>
                                    </div>
                                    <Progress
                                        percent={usagePercent}
                                        status={usagePercent >= 100 ? 'exception' : 'active'}
                                        strokeColor={usagePercent >= 90 ? '#ff4d4f' : '#1677ff'}
                                        showInfo={false}
                                    />
                                </div>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Card size="small" bordered style={{ backgroundColor: '#fcfcfc' }}>
                                            <Statistic
                                                title={t('apiAccess')}
                                                value={subscription?.plans?.features?.api_access ? "Enabled" : "Disabled"}
                                                valueStyle={{ fontSize: '16px', color: subscription?.plans?.features?.api_access ? '#52c41a' : '#d9d9d9' }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card size="small" bordered style={{ backgroundColor: '#fcfcfc' }}>
                                            <Statistic
                                                title="Plan Status"
                                                value={subscription?.status === 'active' ? "Active" : "Expired"}
                                                valueStyle={{ fontSize: '16px' }}
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </Card>

                            {/* 详情信息 */}
                            <Card bordered={false} style={{ borderRadius: '16px' }}>
                                <Descriptions title={t('basicInfo')} column={1} size="middle">
                                    <Descriptions.Item label={t('lastSignIn')}>
                                        <span suppressHydrationWarning>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-'}</span>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('subscription')}>
                                        <Tag color={isPro ? 'gold' : 'blue'}>{subscription?.plans?.name || 'Free'}</Tag>
                                        {subscription?.current_period_end && (
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                Expires: <span suppressHydrationWarning>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                                            </Text>
                                        )}
                                    </Descriptions.Item>
                                </Descriptions>
                                <Divider dashed />
                                <Collapse ghost items={[
                                    {
                                        key: 'session',
                                        label: <Text type="secondary" style={{ fontSize: '12px' }}><CodeOutlined /> {t('sessionDetails')}</Text>,
                                        children: (
                                            <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '8px' }}>
                                                <Paragraph ellipsis={{ rows: 2 }} code copyable={{ text: session?.access_token }}>
                                                    JWT: {session?.access_token}
                                                </Paragraph>
                                            </div>
                                        )
                                    }
                                ]} />
                            </Card>

                            {/* 用户授权码 */}
                            <UserLicenses />
                        </Space>
                    </Col>

                    {/* 右侧：钱包与升级 */}
                    <Col xs={24} md={9}>
                        <Space direction="vertical" size={24} style={{ width: '100%' }}>

                            {/* 余额卡片 */}
                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                                    color: '#fff'
                                }}
                            >
                                <Statistic
                                    title={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>{t('creditsBalance')}</Text>}
                                    value={creditsBalance}
                                    prefix={<WalletOutlined />}
                                    valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 700 }}
                                />
                                <Button
                                    block
                                    style={{ marginTop: '20px', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
                                    onClick={() => router.push(`/${locale}/credits`)}
                                >
                                    {t('buyCredits')}
                                </Button>
                            </Card>

                            {/* 升级提示 */}
                            <Card bordered={false} style={{ borderRadius: '16px', textAlign: 'center' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <RocketOutlined style={{ fontSize: '40px', color: '#faad14' }} />
                                </div>
                                <Title level={5}>Ready for more?</Title>
                                <Paragraph type="secondary">
                                    Upgrade to Pro for higher limits and priority API access.
                                </Paragraph>
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    style={{ borderRadius: '8px' }}
                                    onClick={() => router.push(`/${locale}/pricing`)}
                                >
                                    {t('upgrade')}
                                </Button>
                            </Card>
                        </Space>
                    </Col>
                </Row>
            </div>
        </div>
    );
}