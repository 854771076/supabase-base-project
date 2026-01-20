'use client';

import React, { useRef, useState } from 'react';
import { Card, Descriptions, Tag, Typography, Button, Space, Row, Col, Divider, Result, App } from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  CopyOutlined,
  PrinterOutlined,
  ShoppingOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import TokenPayModal from '@/components/payment/TokenPayModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  metadata?: any;
}
interface OrderDetailProps {
  order: Order;
  locale: string;
}

export function OrderDetail({ order, locale: propLocale }: OrderDetailProps) {
  const t = useTranslations('OrderHistory');
  const locale = useLocale();
  const router = useRouter();
  const { message } = App.useApp();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 1. 增强状态配置
  const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string; bg: string }> = {
    pending: { color: '#faad14', icon: <ClockCircleOutlined />, text: t('pending'), bg: '#fffbe6' },
    processing: { color: '#1890ff', icon: <SyncOutlined spin />, text: t('processing'), bg: '#e6f7ff' },
    completed: { color: '#52c41a', icon: <CheckCircleOutlined />, text: t('completed'), bg: '#f6ffed' },
    failed: { color: '#f5222d', icon: <CloseCircleOutlined />, text: t('failed'), bg: '#fff1f0' },
    cancelled: { color: '#8c8c8c', icon: <CloseCircleOutlined />, text: t('cancelled'), bg: '#f5f5f5' }
  };

  const currentStatus = statusMap[order.status] || statusMap.pending;

  const invoiceRef = useRef<HTMLDivElement>(null);

  // 打印发票功能
  const handlePrint = () => {
    if (invoiceRef.current) {
      const originalDisplay = invoiceRef.current.style.display;
      invoiceRef.current.style.display = 'block';
      window.print();
      invoiceRef.current.style.display = originalDisplay;
    }
  };

  // 下载发票功能 (简化版，实际项目中可能需要生成PDF)
  const handleDownloadInvoice = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    const hideMessage = message.loading('正在生成发票...', 0);

    try {
      // 临时显示隐藏的发票层
      element.style.display = 'block';

      const canvas = await html2canvas(element, {
        scale: 2, // 提高清晰度
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${order.id.slice(0, 8)}.pdf`);

      message.success('发票下载成功');
    } catch (error) {
      console.error('PDF generation error:', error);
      message.error('发票生成失败');
    } finally {
      element.style.display = 'none'; // 重新隐藏
      hideMessage();
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* 隐藏的发票模板 */}
        <div
          ref={invoiceRef}
          style={{
            display: 'none',
            backgroundColor: '#fff',
            padding: '40px',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ margin: 0, color: '#1890ff' }}>INVOICE</h1>
            <p style={{ margin: '10px 0' }}>Order Number: {order.id}</p>
            <p style={{ margin: '5px 0' }}>Date: <span suppressHydrationWarning>{new Date(order.created_at).toLocaleDateString()}</span></p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #e8e8e8', paddingBottom: '5px' }}>Order Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', width: '150px', fontWeight: 'bold' }}>Product:</td>
                  <td style={{ padding: '8px' }}>{order.product_name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Type:</td>
                  <td style={{ padding: '8px' }}>{order.type === 'subscription' ? t('subscriptionService') : t('creditsRecharge')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Status:</td>
                  <td style={{ padding: '8px' }}>
                    <Tag color={currentStatus.color}>{currentStatus.text}</Tag>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Amount:</td>
                  <td style={{ padding: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                    {order.currency.toUpperCase()} {(order.amount_cents / 100).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center', color: '#8c8c8c', fontSize: '12px' }}>
            <p>Thank you for your business!</p>
            <p>This is an electronic invoice. No signature required.</p>
          </div>
        </div>

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
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>{t('print')}</Button>
              {order.status === 'completed' && <Button type="primary" onClick={handleDownloadInvoice}>{t('downloadInvoice')}</Button>}
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
                {order.status === 'pending' && order.provider === 'tokenpay' && order.metadata && (
                  <Button
                    type="primary"
                    icon={<WalletOutlined />}
                    style={{ marginTop: 12 }}
                    onClick={() => setIsModalVisible(true)}
                  >
                    {t('payNow')}
                  </Button>
                )}
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

        <TokenPayModal
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          orderId={order.id}
          metadata={order.metadata}
          onSuccess={() => {
            setIsModalVisible(false);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}