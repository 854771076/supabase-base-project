'use client';

import React, { useState } from 'react';
import { 
    Card, Table, Tag, Select, Space, Typography, 
    Empty, Row, Col, Statistic, Divider, Button, Tooltip 
} from 'antd';
import { 
    ClockCircleOutlined, CheckCircleOutlined, 
    CloseCircleOutlined, DollarOutlined, 
    FilterOutlined, DownloadOutlined,
    SyncOutlined, ArrowRightOutlined
} from '@ant-design/icons';

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
}

// --- 样式配置抽取 ---
const STATUS_MAP: Record<string, { color: string; text: string; icon: React.ReactNode; bg: string }> = {
    pending: { color: '#8c8c8c', text: '待支付', icon: <ClockCircleOutlined />, bg: '#fafafa' },
    processing: { color: '#1890ff', text: '处理中', icon: <SyncOutlined spin />, bg: '#e6f7ff' },
    completed: { color: '#52c41a', text: '已完成', icon: <CheckCircleOutlined />, bg: '#f6ffed' },
    failed: { color: '#f5222d', text: '已失败', icon: <CloseCircleOutlined />, bg: '#fff1f0' },
    cancelled: { color: '#faad14', text: '已取消', icon: <CloseCircleOutlined />, bg: '#fffbe6' }
};

export default function OrderHistory({ orders = [] }: { orders: Order[] }) {
    const [filterType, setFilterType] = useState<string>('all');

    // 数据处理
    const filteredOrders = orders.filter(o => filterType === 'all' || o.type === filterType);
    const stats = {
        total: orders.length,
        spent: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount_cents, 0) / 100,
        successRate: orders.length ? Math.round((orders.filter(o => o.status === 'completed').length / orders.length) * 100) : 0
    };

    const columns = [
        {
            title: '订单信息',
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
            title: '分类',
            dataIndex: 'type',
            render: (type: string) => (
                <Tag color={type === 'subscription' ? 'purple' : 'blue'} bordered={false} style={{ borderRadius: '4px' }}>
                    {type.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: '金额',
            dataIndex: 'amount_cents',
            sorter: (a: Order, b: Order) => a.amount_cents - b.amount_cents,
            render: (cents: number, record: Order) => (
                <Text strong style={{ color: '#262626', fontSize: '16px' }}>
                    {record.currency} {(cents / 100).toFixed(2)}
                </Text>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            render: (status: string) => {
                const cfg = STATUS_MAP[status] || STATUS_MAP.pending;
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
            title: '时间',
            dataIndex: 'created_at',
            render: (date: string) => (
                <Tooltip title={new Date(date).toString()}>
                    <Text type="secondary">{new Date(date).toLocaleDateString()}</Text>
                </Tooltip>
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: () => (
                <Button type="link" size="small" icon={<ArrowRightOutlined />}>详情</Button>
            ),
        }
    ];

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <Row justify="space-between" align="bottom" style={{ marginBottom: '32px' }}>
                    <Col>
                        <Title level={2} style={{ margin: 0, letterSpacing: '-0.5px' }}>账单与记录</Title>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            管理您的订阅方案及消费记录
                        </Paragraph>
                    </Col>
                    <Col>
                        <Button icon={<DownloadOutlined />}>导出报告</Button>
                    </Col>
                </Row>

                {/* Stats Section */}
                <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
                    {[
                        { title: '总订单数', value: stats.total, icon: <ClockCircleOutlined />, color: '#1890ff' },
                        { title: '累计消费', value: `$${stats.spent}`, icon: <DollarOutlined />, color: '#52c41a' },
                        { title: '支付成功率', value: `${stats.successRate}%`, icon: <CheckCircleOutlined />, color: '#722ed1' }
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
                            <span>记录筛选</span>
                            <Select 
                                defaultValue="all" 
                                variant="borderless"
                                onChange={setFilterType}
                                style={{ width: 120, marginLeft: '8px', color: '#1890ff', fontWeight: 600 }}
                            >
                                <Select.Option value="all">全部类型</Select.Option>
                                <Select.Option value="subscription">订阅方案</Select.Option>
                                <Select.Option value="credits">点数充值</Select.Option>
                            </Select>
                        </Space>
                    }
                >
                    <Table 
                        dataSource={filteredOrders.map(o => ({ ...o, key: o.id }))} 
                        columns={columns} 
                        pagination={{ 
                            pageSize: 8, 
                            showTotal: (t) => `共 ${t} 条记录`,
                            size: 'small' 
                        }}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无消费记录" /> }}
                    />
                </Card>
            </div>
        </div>
    );
}