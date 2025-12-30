'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Typography, Button, Space, Card, Row, Col } from 'antd';
import {
  RocketOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  ReadOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Home() {
  const t = useTranslations('Index');

  const features = [
    {
      key: 'auth',
      icon: <SafetyCertificateOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
    },
    {
      key: 'db',
      icon: <DatabaseOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
    },
    {
      key: 'ui',
      icon: <RocketOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
    },
    {
      key: 'i18n',
      icon: <GlobalOutlined style={{ fontSize: '32px', color: '#eb2f96' }} />,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px', width: '100%' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <Space direction="vertical" size="large">
          <Title level={1} style={{ fontSize: '48px', marginBottom: 0 }}>
            {t('title')}
          </Title>
          <Paragraph type="secondary" style={{ fontSize: '20px', maxWidth: 600, margin: '0 auto' }}>
            {t('description')}
          </Paragraph>
          <Space size="middle" style={{ marginTop: '24px' }}>
            <Link href="/login">
              <Button type="primary" size="large" icon={<RocketOutlined />}>
                {t('getStarted')}
              </Button>
            </Link>
            <Link href="/api-docs">
              <Button size="large" icon={<ReadOutlined />}>
                {t('doc')}
              </Button>
            </Link>
          </Space>
        </Space>
      </div>

      {/* Features Section */}
      <div style={{ marginBottom: '48px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '48px' }}>
          {t('features.title')}
        </Title>
        <Row gutter={[24, 24]}>
          {features.map((feature) => (
            <Col xs={24} sm={12} md={6} key={feature.key}>
              <Card
                hoverable
                style={{ height: '100%', textAlign: 'center' }}
                bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
              >
                {feature.icon}
                <div>
                  <Title level={4} style={{ marginBottom: '8px' }}>
                    {t(`features.${feature.key}`)}
                  </Title>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {t(`features.${feature.key}Desc`)}
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
