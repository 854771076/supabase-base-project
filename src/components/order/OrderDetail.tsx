'use client';

import React from 'react';
import { Card, Descriptions, Tag, Typography, Button, Space, Row, Col, Divider, Result } from 'antd';
import { 
  ArrowLeftOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  SyncOutlined,
  CopyOutlined,
  PrinterOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
interface Order {
    id: string;
    type: 'subscription' | 'credits';
    provider: string;
    provider_order_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    amount_cents: number;
    currency: string;
    product_name: string;
    created_at: string;
    completed_at?: string;
}
interface OrderDetailProps {
  order: Order;
  locale: string;
}

export function OrderDetail({ order, locale }: OrderDetailProps) {
  const t = useTranslations('OrderHistory');
  const router = useRouter();

  // 1. 增强状态配置
  const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string; bg: string }> = {
    pending: { color: '#faad14', icon: <ClockCircleOutlined />, text: t('pending'), bg: '#fffbe6' },
    processing: { color: '#1890ff', icon: <SyncOutlined spin />, text: t('processing'), bg: '#e6f7ff' },
    completed: { color: '#52c41a', icon: <CheckCircleOutlined />, text: t('completed'), bg: '#f6ffed' },
    failed: { color: '#f5222d', icon: <CloseCircleOutlined />, text: t('failed'), bg: '#fff1f0' },
    cancelled: { color: '#8c8c8c', icon: <CloseCircleOutlined />, text: t('cancelled'), bg: '#f5f5f5' }
  };

  const currentStatus = statusMap[order.status] || statusMap.pending;

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* 页眉导航 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.back()}
              style={{ padding: 0 }}
            >
              {t('back')}
            </Button>
          </Col>
          <Col>
            <Space>
              <Button icon={<PrinterOutlined />}>{t('print')}</Button>
              {order.status === 'completed' && <Button type="primary">{t('downloadInvoice')}</Button>}
            </Space>
          </Col>
        </Row>

        {/* 核心状态横幅 */}
        <Card 
          bordered={false} 
          style={{ 
            borderRadius: 16, 
            marginBottom: 24, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            background: currentStatus.bg 
          }}
        >
          <Row align="middle" gutter={24}>
            <Col xs={24} sm={16}>
              <Space size="middle" align="start">
                <div style={{ 
                  backgroundColor: '#fff', 
                  padding: 12, 
                  borderRadius: 12, 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
                }}>
                  <ShoppingOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                </div>
                <div>
                  <Text type="secondary">{t('orderId')}: {order.id}</Text>
                  <Title level={3} style={{ margin: '4px 0' }}>{order.product_name}</Title>
                  <Tag color={currentStatus.color} icon={currentStatus.icon} style={{ borderRadius: 4 }}>
                    {currentStatus.text}
                  </Tag>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">{t('amount')}</Text>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#262626' }}>
                  <span style={{ fontSize: 16, marginRight: 4 }}>{order.currency.toUpperCase()}</span>
                  {(order.amount_cents / 100).toFixed(2)}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 详情栅格布局 */}
        <Row gutter={24}>
          {/* 左侧主要详情 */}
          <Col xs={24} md={16}>
            <Card 
              title={t('orderDetails')} 
              bordered={false} 
              style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <Descriptions column={1} labelStyle={{ color: '#8c8c8c' }} contentStyle={{ fontWeight: 500 }}>
                <Descriptions.Item label={t('category')}>
                  {order.type === 'subscription' ? t('subscriptionService') : t('creditsRecharge')}
                </Descriptions.Item>
                <Descriptions.Item label={t('provider')}>
                  {order.provider.toUpperCase()}
                </Descriptions.Item>
                <Descriptions.Item label={t('providerOrderId')}>
                  <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ margin: 0 }}>
                    {order.provider_order_id}
                  </Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label={t('createdAt')}>
                  {new Date(order.created_at).toLocaleString(locale)}
                </Descriptions.Item>
                {order.completed_at && (
                  <Descriptions.Item label={t('completedAt')}>
                    {new Date(order.completed_at).toLocaleString(locale)}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>

          {/* 右侧支付概览 */}
          <Col xs={24} md={8}>
            <Card 
              bordered={false} 
              style={{ borderRadius: 16, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <Title level={5} style={{ marginBottom: 20 }}>{t('paymentSummary')}</Title>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{t('originalPrice')}</Text>
                  <Text>{order.currency.toUpperCase()} {(order.amount_cents / 100).toFixed(2)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{t('discount')}</Text>
                  <Text color="green">- 0.00</Text>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>{t('actualPayment')}</Text>
                  <Text strong style={{ color: '#f5222d', fontSize: 18 }}>
                    {order.currency.toUpperCase()} {(order.amount_cents / 100).toFixed(2)}
                  </Text>
                </div>
              </Space>
              
              <Divider />
              
              <div style={{ textAlign: 'center' }}>
                <Result
                  status={order.status === 'completed' ? 'success' : 'info'}
                  subTitle={order.status === 'completed' ? t('thankYouForPurchase') : t('waitingForPaymentConfirmation')}
                  icon={null}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}