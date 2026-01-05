'use client';

import React from 'react';
import { Card, Descriptions, Tag, Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

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
  user_id: string;
}

interface OrderDetailProps {
  order: Order;
  locale: string;
}

export function OrderDetail({ order, locale }: OrderDetailProps) {
  const t = useTranslations('OrderHistory');
  const router = useRouter();

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    const statusText = {
      pending: t('pending'),
      processing: t('processing'),
      completed: t('completed'),
      failed: t('failed'),
      cancelled: t('cancelled')
    };

    const statusColor = {
      pending: 'orange',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray'
    };

    const statusIcon = {
      pending: <ClockCircleOutlined />,
      processing: <SyncOutlined spin />,
      completed: <CheckCircleOutlined />,
      failed: <CloseCircleOutlined />,
      cancelled: <CloseCircleOutlined />
    };

    return {
      text: statusText[status as keyof typeof statusText] || status,
      color: statusColor[status as keyof typeof statusColor] || 'default',
      icon: statusIcon[status as keyof typeof statusIcon] || null
    };
  };

  // 获取订单类型文本
  const getOrderTypeText = (type: string) => {
    return type === 'subscription' ? t('subscription') : t('credits');
  };

  // 格式化金额
  const formatAmount = (amountCents: number, currency: string) => {
    return `${currency.toUpperCase()} ${(amountCents / 100).toFixed(2)}`;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(locale);
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      {/* 返回按钮 */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: '16px' }}
      >
        {t('back')}
      </Button>

      {/* 订单标题 */}
      <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
        {t('orderInfo')}
      </Title>

      {/* 订单状态卡片 */}
      <Card
        style={{ marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
        bodyStyle={{ padding: '24px' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>{order.product_name}</Title>
            <Text strong style={{ fontSize: '24px', margin: '0 8px' }}>
              {formatAmount(order.amount_cents, order.currency)}
            </Text>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Tag
              color={statusConfig.color}
              icon={statusConfig.icon}
              style={{ fontSize: '16px', padding: '8px 24px' }}
            >
              {statusConfig.text}
            </Tag>
          </div>
        </Space>
      </Card>

      {/* 订单详情卡片 */}
      <Card
        title={<Text strong>{t('orderDetails')}</Text>}
        style={{ marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
      >
        <Descriptions bordered layout="vertical" column={1}>
          <Descriptions.Item label={t('orderId')}>{order.id}</Descriptions.Item>
          <Descriptions.Item label={t('category')}>{getOrderTypeText(order.type)}</Descriptions.Item>
          <Descriptions.Item label={t('provider')}>{order.provider}</Descriptions.Item>
          <Descriptions.Item label={t('providerOrderId')}>{order.provider_order_id}</Descriptions.Item>
          <Descriptions.Item label={t('amount')}>{formatAmount(order.amount_cents, order.currency)}</Descriptions.Item>
          <Descriptions.Item label={t('status')}>
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
              {statusConfig.text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('createdAt')}>{formatDate(order.created_at)}</Descriptions.Item>
          {order.completed_at && (
            <Descriptions.Item label={t('completedAt')}>{formatDate(order.completed_at)}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 操作按钮 */}
      <div style={{ textAlign: 'center' }}>
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(`/${locale}/orders`)}
        >
          {t('backToOrders')}
        </Button>
      </div>
    </div>
  );
}
