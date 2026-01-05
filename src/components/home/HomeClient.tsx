'use client';

import { Link } from '@/i18n/navigation';
import { Typography, Button, Space, Card, Row, Col, Grid } from 'antd';
const { useBreakpoint } = Grid;
import {
    RocketOutlined,
    DatabaseOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
    ReadOutlined
} from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph } = Typography;

export default function HomeClient() {
    const t = useTranslations('Index');

    const screens = useBreakpoint();
    const isMobile = !!(screens.xs || (screens.sm && !screens.md));

    const features = [
        {
            key: 'auth',
            title: t('features.auth'),
            desc: t('features.authDesc'),
            icon: <SafetyCertificateOutlined style={{ fontSize: isMobile ? '24px' : '32px', color: '#1890ff' }} />,
        },
        {
            key: 'db',
            title: t('features.db'),
            desc: t('features.dbDesc'),
            icon: <DatabaseOutlined style={{ fontSize: isMobile ? '24px' : '32px', color: '#52c41a' }} />,
        },
        {
            key: 'ui',
            title: t('features.ui'),
            desc: t('features.uiDesc'),
            icon: <RocketOutlined style={{ fontSize: isMobile ? '24px' : '32px', color: '#faad14' }} />,
        },
        {
            key: 'i18n',
            title: t('features.i18n'),
            desc: t('features.i18nDesc'),
            icon: <GlobalOutlined style={{ fontSize: isMobile ? '24px' : '32px', color: '#eb2f96' }} />,
        },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 24px', width: '100%' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '80px' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Title level={1} style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: 0 }}>
                        {t('title')}
                    </Title>
                    <Paragraph type="secondary" style={{ fontSize: isMobile ? '16px' : '20px', maxWidth: 600, margin: '0 auto' }}>
                        {t('description')}
                    </Paragraph>
                    <Space size="middle" style={{ marginTop: '24px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/login">
                            <Button type="primary" size="large" icon={<RocketOutlined />} style={{ width: isMobile ? '100%' : 'auto' }}>
                                {t('getStarted')}
                            </Button>
                        </Link>
                        <Link href="/api-docs">
                            <Button size="large" icon={<ReadOutlined />} style={{ width: isMobile ? '100%' : 'auto' }}>
                                {t('doc')}
                            </Button>
                        </Link>
                    </Space>
                </Space>
            </div>

            {/* Features Section */}
            <div style={{ marginBottom: '48px' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '48px', fontSize: isMobile ? '24px' : '30px' }}>
                    {t('featuresTitle')}
                </Title>
                <Row gutter={[24, 24]}>
                    {features.map((feature) => (
                        <Col xs={24} sm={12} md={6} key={feature.key}>
                            <Card
                                hoverable
                                style={{ height: '100%', textAlign: 'center' }}
                                styles={{ body: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: isMobile ? '16px' : '24px' } }}
                            >
                                {feature.icon}
                                <div>
                                    <Title level={4} style={{ marginBottom: '8px', fontSize: isMobile ? '18px' : '20px' }}>
                                        {feature.title}
                                    </Title>
                                    <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: isMobile ? '14px' : '16px' }}>
                                        {feature.desc}
                                    </Paragraph>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
}
