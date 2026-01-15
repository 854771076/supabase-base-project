'use client';

import React, { useState } from 'react';
import {
    Card, Table, Tag, Select, Space, Typography,
    Empty, Row, Col, Statistic, Divider, Button, Tooltip,
    App
} from 'antd';
import {
    ClockCircleOutlined, CheckCircleOutlined,
    CloseCircleOutlined, DollarOutlined,
    FilterOutlined, DownloadOutlined,
    SyncOutlined, ArrowRightOutlined,
    WalletOutlined
} from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';
import TokenPayModal from '@/components/payment/TokenPayModal';

const { Title, Text, Paragraph } = Typography;

// --- 类型统一定义 ---
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

// --- 样式配置抽取 ---
export default function OrderHistory({ orders = [], locale: propLocale }: { orders: Order[], locale: string }) {
    const t = useTranslations('OrderHistory');
    const locale = useLocale();
    const [filterType, setFilterType] = useState<string>('all');
    const { message } = App.useApp();
    const router = useRouter();

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    // 数据处理
    const filteredOrders = orders.filter(o => filterType === 'all' || o.type === filterType);
    const stats = {
        total: orders.length,
        spent: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount_cents, 0) / 100,
        successRate: orders.length ? Math.round((orders.filter(o => o.status === 'completed').length / orders.length) * 100) : 0
    };

    // 获取状态配置
    const getStatusConfig = (status: string) => {
        const statusText = {
            pending: t('pending'),
            processing: t('processing'),
            completed: t('completed'),
            failed: t('failed'),
            cancelled: t('cancelled')
        };

        const statusColors: Record<string, string> = {
            pending: '#8c8c8c',
            processing: '#1890ff',
            completed: '#52c41a',
            failed: '#f5222d',
            cancelled: '#faad14'
        };

        const statusIcons: Record<string, React.ReactNode> = {
            pending: <ClockCircleOutlined />,
            processing: <SyncOutlined spin />,
            completed: <CheckCircleOutlined />,
            failed: <CloseCircleOutlined />,
            cancelled: <CloseCircleOutlined />
        };

        return {
            text: statusText[status as keyof typeof statusText] || statusText.pending,
            color: statusColors[status] || statusColors.pending,
            icon: statusIcons[status] || statusIcons.pending
        };
    };

    // 导出报告功能
    const handleExportReport = () => {
        try {
            if (filteredOrders.length === 0) {
                console.log('No records to export, showing message...', message);
                // 使用message的原始调用方式
                message.info(t('noRecordsToExport'));
                return;
            }

            // 简单的CSV导出实现
            const headers = ['Order ID', 'Product Name', 'Type', 'Amount', 'Currency', 'Status', 'Created At', 'Completed At'];
            const csvContent = [
                headers.join(','),
                ...filteredOrders.map(order => [
                    order.id,
                    `"${order.product_name}"`,
                    order.type,
                    (order.amount_cents / 100).toFixed(2),
                    order.currency,
                    t(order.status as keyof typeof t),
                    new Date(order.created_at).toISOString(),
                    order.completed_at ? new Date(order.completed_at).toISOString() : ''
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `order-history-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('Export success, showing message...');
            message.success(t('exportReportSuccess'));
        } catch (error) {
            console.error('Export error, showing message...', error);
            message.error(t('exportReportError'));
        }
    };

    const columns = [
        {
            title: t('orderInfo'),
            key: 'product',
            render: (_: any, record: Order) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: '15px' }}>{record.product_name}</Text>
                    <Text type="secondary" copyable={{ text: record.id }} style={{ fontSize: '12px' }}>
                        ID: {record.id.slice(0, 8)}...
                    </Text>
                </Space>
            ),
        },
        {
            title: t('category'),
            dataIndex: 'type',
            render: (type: string) => (
                <Tag color={type === 'subscription' ? 'purple' : 'blue'} bordered={false} style={{ borderRadius: '4px' }}>
                    {type === 'subscription' ? t('subscription') : t('credits')}
                </Tag>
            ),
        },
        {
            title: t('amount'),
            dataIndex: 'amount_cents',
            sorter: (a: Order, b: Order) => a.amount_cents - b.amount_cents,
            render: (cents: number, record: Order) => (
                <Text strong style={{ color: '#262626', fontSize: '16px' }}>
                    {record.currency} {(cents / 100).toFixed(2)}
                </Text>
            ),
        },
        {
            title: t('status'),
            dataIndex: 'status',
            render: (status: string) => {
                const cfg = getStatusConfig(status);
                return (
                    <Tag
                        icon={cfg.icon}
                        color={cfg.color}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                        {cfg.text}
                    </Tag>
                );
            }
        },
        {
            title: t('time'),
            dataIndex: 'created_at',
            render: (date: string) => (
                <Tooltip title={new Date(date).toString()}>
                    <Text type="secondary">{new Date(date).toLocaleDateString()}</Text>
                </Tooltip>
            ),
        },
        {
            title: t('action'),
            key: 'action',
            render: (_: any, record: Order) => (
                <Space>
                    {record.status === 'pending' && record.provider === 'tokenpay' && record.metadata && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<WalletOutlined />}
                            onClick={() => {
                                setSelectedOrder(record);
                                setIsModalVisible(true);
                            }}
                        >
                            {t('payNow')}
                        </Button>
                    )}
                    <Button
                        type="link"
                        size="small"
                        icon={<ArrowRightOutlined />}
                        onClick={() => router.push(`/${locale}/orders/${record.id}`)}
                    >
                        {t('details')}
                    </Button>
                </Space>
            ),
        }
    ];

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                {/* Header Section */}
                <Row justify="space-between" align="bottom" style={{ marginBottom: '32px' }}>
                    <Col>
                        <Title level={2} style={{ margin: 0, letterSpacing: '-0.5px' }}>
                            {t('title')}
                        </Title>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            {t('subtitle')}
                        </Paragraph>
                    </Col>
                    <Col>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExportReport}
                        >
                            {t('exportReport')}
                        </Button>
                    </Col>
                </Row>

                {/* Stats Section */}
                <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
                    {[
                        {
                            title: t('totalOrders'),
                            value: stats.total,
                            icon: <ClockCircleOutlined />,
                            color: '#1890ff'
                        },
                        {
                            title: t('totalSpent'),
                            value: `$${stats.spent}`,
                            icon: <DollarOutlined />,
                            color: '#52c41a'
                        },
                        {
                            title: t('successRate'),
                            value: `${stats.successRate}%`,
                            icon: <CheckCircleOutlined />,
                            color: '#722ed1'
                        }
                    ].map((item, i) => (
                        <Col xs={24} sm={8} key={i}>
                            <Card bordered={false} hoverable style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <Statistic
                                    title={<Text type="secondary">{item.title}</Text>}
                                    value={item.value}
                                    valueStyle={{ color: item.color, fontWeight: 700 }}
                                    prefix={item.icon}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Table Section */}
                <Card
                    bordered={false}
                    style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                    title={
                        <Space>
                            <FilterOutlined />
                            <span>{t('filterRecords')}</span>
                            <Select
                                defaultValue="all"
                                variant="borderless"
                                onChange={setFilterType}
                                style={{ width: 120, marginLeft: '8px', color: '#1890ff', fontWeight: 600 }}
                            >
                                <Select.Option value="all">{t('allTypes')}</Select.Option>
                                <Select.Option value="subscription">{t('subscription')}</Select.Option>
                                <Select.Option value="credits">{t('credits')}</Select.Option>
                            </Select>
                        </Space>
                    }
                >
                    <Table
                        dataSource={filteredOrders.map(o => ({ ...o, key: o.id }))}
                        columns={columns}
                        pagination={{
                            pageSize: 8,
                            showTotal: (total) => t('totalRecords').replace('{total}', total.toString()),
                            size: 'small'
                        }}
                        scroll={{ x: 'max-content' }}
                        locale={{
                            emptyText: <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={t('noRecords')}
                            />
                        }}
                    />
                </Card>

                <TokenPayModal
                    visible={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    orderId={selectedOrder?.id || ''}
                    metadata={selectedOrder?.metadata}
                    onSuccess={() => {
                        setIsModalVisible(false);
                        router.refresh();
                    }}
                />
            </div>
        </div>
    );
}