'use client';

import React, { useState } from 'react';
import { Card, Table, Tag, Select, Space, Typography, Empty, Row, Col, Statistic, Divider } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined, FilterOutlined } from '@ant-design/icons';

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
            width: 120,
            render: (type: string) => {
                const config = getTypeConfig(type);
                return (
                    <Space>
                        <Tag 
                            color={config.color} 
                            style={{ borderRadius: '16px', padding: '2px 12px', fontWeight: 500 }}
                        >
                            {config.text}
                        </Tag>
                    </Space>
                );
            }
        },
        {
            title: 'Product',
            dataIndex: 'product_name',
            key: 'product_name',
            width: 200,
            render: (name: string) => (
                <Text strong style={{ fontSize: '14px' }}>{name}</Text>
            )
        },
        {
            title: 'Amount',
            dataIndex: ['amount_cents', 'currency'],
            key: 'amount',
            width: 150,
            render: (value: [number, string]) => {
                const [amountCents, currency] = value;
                const amount = (amountCents / 100).toFixed(2);
                return (
                    <Space>
                        <DollarOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                        <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>{amount}</Text>
                        <Text type="secondary" style={{ fontSize: '14px' }}>{currency}</Text>
                    </Space>
                );
            },
            sorter: (a: Order, b: Order) => a.amount_cents - b.amount_cents
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 160,
            render: (status: string) => {
                const config = getStatusConfig(status);
                return (
                    <Space size="middle">
                        {config.icon}
                        <Tag 
                            color={config.color} 
                            style={{ borderRadius: '16px', padding: '2px 12px', fontWeight: 500 }}
                        >
                            {config.text}
                        </Tag>
                    </Space>
                );
            }
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 200,
            render: (date: string) => (
                <Text style={{ fontSize: '14px' }}>{new Date(date).toLocaleString()}</Text>
            ),
            sorter: (a: Order, b: Order) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            defaultSortOrder: 'descend' as const
        },
        {
            title: 'Completed At',
            dataIndex: 'completed_at',
            key: 'completed_at',
            width: 200,
            render: (date?: string) => (
                <Text style={{ fontSize: '14px', opacity: date ? 1 : 0.5 }}>
                    {date ? new Date(date).toLocaleString() : '-'} 
                </Text>
            )
        }
    ];

    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '32px' }}>
                <Title level={3} style={{ marginBottom: '8px', fontWeight: 600 }}>
                    Order History
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                    Track all your payment activity
                </Text>
            </div>
            
            {/* Statistics Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} md={8}>
                    <Card 
                        size="small" 
                        style={{ 
                            borderRadius: '12px', 
                            border: '1px solid #e8e8e8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: '14px', color: '#666' }}>Total Orders</Text>}
                            value={totalOrders}
                            prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card 
                        size="small" 
                        style={{ 
                            borderRadius: '12px', 
                            border: '1px solid #e8e8e8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: '14px', color: '#666' }}>Total Spent</Text>}
                            value={(totalSpent / 100).toFixed(2)}
                            prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                            suffix="USD"
                            valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card 
                        size="small" 
                        style={{ 
                            borderRadius: '12px', 
                            border: '1px solid #e8e8e8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                        }}
                    >
                        <Statistic
                            title={<Text style={{ fontSize: '14px', color: '#666' }}>Completed Orders</Text>}
                            value={completedOrders.length}
                            prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
                            valueStyle={{ color: '#722ed1', fontSize: '28px', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
            </Row>
            
            {/* Main Content Card */}
            <Card 
                style={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e8e8e8',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden'
                }}
            >
                {/* Filter Header */}
                <div style={{ 
                    padding: '16px 24px', 
                    backgroundColor: '#fafafa', 
                    borderBottom: '1px solid #e8e8e8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <Space>
                        <FilterOutlined style={{ color: '#1890ff' }} />
                        <Text strong style={{ fontSize: '14px' }}>Filter Orders</Text>
                    </Space>
                    
                    <Select
                        value={filterType}
                        onChange={setFilterType}
                        style={{ width: 200 }}
                        size="large"
                        placeholder="Filter by type"
                    >
                        <Option value="all">All Orders</Option>
                        <Option value="subscription">Subscriptions</Option>
                        <Option value="credits">Credits</Option>
                    </Select>
                </div>
                
                <div style={{ padding: '24px' }}>
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
                                    showSizeChanger: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
                                    pageSizeOptions: ['10', '20', '50', '100'],
                                    size: 'default'
                                }}
                                scroll={{ x: 800 }}
                                bordered={false}
                                size="middle"
                                style={{ borderRadius: '8px', overflow: 'hidden' }}
                                onRow={(record, index) => ({
                                    style: {
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: '#fafafa'
                                        }
                                    }
                                })}
                                tableLayout="fixed"
                            />
                            
                            {/* Summary */}
                            <Divider style={{ margin: '24px 0 0' }} />
                            <div style={{ 
                                marginTop: '16px', 
                                textAlign: 'right',
                                color: '#666',
                                fontSize: '14px'
                            }}>
                                Showing <Text strong>{startIndex + 1}</Text> to <Text strong>{Math.min(endIndex, total)}</Text> of <Text strong>{total}</Text> orders
                            </div>
                        </>
                    ) : (
                        <Empty
                            description={<Text type="secondary">No orders found</Text>}
                            style={{ padding: '64px 0' }}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}