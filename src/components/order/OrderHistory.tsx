'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Select, Space, Typography, Empty, Row, Col, Statistic } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

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

interface OrderHistoryProps {
    orders: Order[];
    initialType?: 'subscription' | 'credits' | 'all';
}

const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
        pending: { color: 'default', text: 'Pending', icon: <ClockCircleOutlined /> },
        processing: { color: 'blue', text: 'Processing', icon: <ClockCircleOutlined spin /> },
        completed: { color: 'success', text: 'Completed', icon: <CheckCircleOutlined /> },
        failed: { color: 'error', text: 'Failed', icon: <CloseCircleOutlined /> },
        cancelled: { color: 'warning', text: 'Cancelled', icon: <CloseCircleOutlined /> }
    };
    return configs[status] || { color: 'default', text: status, icon: <ClockCircleOutlined /> };
};

const getTypeConfig = (type: string) => {
    const configs: Record<string, { color: string; text: string }> = {
        subscription: { color: 'purple', text: 'Subscription' },
        credits: { color: 'blue', text: 'Credits' }
    };
    return configs[type] || { color: 'default', text: type };
};

export default function OrderHistory({ orders, initialType = 'all' }: OrderHistoryProps) {
    const [filterType, setFilterType] = useState<'all' | 'subscription' | 'credits'>(initialType);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Filter orders by type
    const filteredOrders = filterType === 'all' 
        ? orders 
        : orders.filter(order => order.type === filterType);

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    const total = filteredOrders.length;

    // Calculate statistics
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalSpent = completedOrders.reduce((sum, order) => sum + order.amount_cents, 0);
    const totalOrders = orders.length;

    const columns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
                const config = getTypeConfig(type);
                return <Tag color={config.color}>{config.text}</Tag>;
            }
        },
        {
            title: 'Product',
            dataIndex: 'product_name',
            key: 'product_name',
            render: (name: string) => <Text strong>{name}</Text>
        },
        {
            title: 'Amount',
            dataIndex: ['amount_cents', 'currency'],
            key: 'amount',
            render: (value: [number, string]) => {
                const [amountCents, currency] = value;
                const amount = (amountCents / 100).toFixed(2);
                return (
                    <Space>
                        <DollarOutlined />
                        <Text strong>{amount}</Text>
                        <Text type="secondary">{currency}</Text>
                    </Space>
                );
            },
            sorter: (a: Order, b: Order) => a.amount_cents - b.amount_cents
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const config = getStatusConfig(status);
                return (
                    <Space>
                        {config.icon}
                        <Tag color={config.color}>{config.text}</Tag>
                    </Space>
                );
            }
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleString(),
            sorter: (a: Order, b: Order) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            defaultSortOrder: 'descend' as const
        },
        {
            title: 'Completed At',
            dataIndex: 'completed_at',
            key: 'completed_at',
            render: (date?: string) => date ? new Date(date).toLocaleString() : '-'
        }
    ];

    return (
        <div style={{ padding: '24px 0' }}>
            <Title level={4} style={{ marginBottom: '24px' }}>Order History</Title>
            
            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={8}>
                    <Card size="small">
                        <Statistic
                            title="Total Orders"
                            value={totalOrders}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card size="small">
                        <Statistic
                            title="Total Spent"
                            value={(totalSpent / 100).toFixed(2)}
                            prefix={<DollarOutlined />}
                            suffix="USD"
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card size="small">
                        <Statistic
                            title="Completed Orders"
                            value={completedOrders.length}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>
            
            <Card>
                {/* Filter and Controls */}
                <Space style={{ marginBottom: '16px' }}>
                    <Text strong>Filter by Type:</Text>
                    <Select
                        value={filterType}
                        onChange={setFilterType}
                        style={{ width: 180 }}
                    >
                        <Option value="all">All Orders</Option>
                        <Option value="subscription">Subscriptions</Option>
                        <Option value="credits">Credits</Option>
                    </Select>
                </Space>
                
                {/* Orders Table */}
                {paginatedOrders.length > 0 ? (
                    <>
                        <Table
                            columns={columns}
                            dataSource={paginatedOrders.map(order => ({ ...order, key: order.id }))}
                            pagination={{
                                current: page,
                                pageSize,
                                total,
                                onChange: setPage,
                                showSizeChanger: false,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`
                            }}
                            scroll={{ x: 800 }}
                            bordered
                            size="middle"
                        />
                        
                        {/* Summary */}
                        <div style={{ marginTop: '16px', textAlign: 'right' }}>
                            <Text type="secondary">
                                Showing {startIndex + 1} to {Math.min(endIndex, total)} of {total} orders
                            </Text>
                        </div>
                    </>
                ) : (
                    <Empty
                        description="No orders found"
                        style={{ padding: '48px 0' }}
                    />
                )}
            </Card>
        </div>
    );
}