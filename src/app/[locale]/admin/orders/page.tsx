'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, Card, Select, Modal, Descriptions, App, DatePicker } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph, Text } = Typography;

interface OrderItem {
    id: string;
    product_name: string;
    product_thumbnail: string | null;
    quantity: number;
    unit_price_cents: number;
    total_price_cents: number;
}

interface Order {
    id: string;
    user_id: string;
    type: 'subscription' | 'credits' | 'product';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    amount_cents: number;
    currency: string;
    provider: string;
    product_name: string | null;
    order_items: OrderItem[];
    shipping_address: any | null;
    created_at: string;
    completed_at: string | null;
}

export default function AdminOrdersPage() {
    const t = useTranslations('Admin');
    const tOrder = useTranslations('OrderHistory');
    const { message } = App.useApp();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const pageSize = 10;

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter, typeFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: pageSize.toString(),
                offset: ((page - 1) * pageSize).toString(),
            });
            if (statusFilter) params.set('status', statusFilter);
            if (typeFilter) params.set('type', typeFilter);

            const res = await fetch(`/api/v1/admin/orders?${params}`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/v1/admin/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(t('statusUpdated'));
                fetchOrders();
            } else {
                message.error(data.error || t('error'));
            }
        } catch (error) {
            message.error(t('error'));
        }
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'orange',
            processing: 'blue',
            completed: 'green',
            failed: 'red',
            cancelled: 'default',
        };
        return colors[status] || 'default';
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            subscription: 'purple',
            credits: 'cyan',
            product: 'blue',
        };
        return colors[type] || 'default';
    };

    const columns = [
        {
            title: t('orderId'),
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <Text code style={{ fontSize: '12px' }}>{id.slice(0, 8)}...</Text>,
        },
        {
            title: t('type'),
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color={getTypeColor(type)}>{tOrder(type)}</Tag>,
        },
        {
            title: t('product'),
            key: 'product',
            render: (_: any, record: Order) => {
                if (record.order_items?.length > 0) {
                    return record.order_items.map(item => item.product_name).join(', ');
                }
                return record.product_name || '-';
            },
        },
        {
            title: t('amount'),
            dataIndex: 'amount_cents',
            key: 'amount',
            render: (cents: number, record: Order) => `$${(cents / 100).toFixed(2)} ${record.currency}`,
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: Order) => (
                <Select
                    value={status}
                    size="small"
                    style={{ width: 120 }}
                    onChange={(val) => handleStatusChange(record.id, val)}
                >
                    <Select.Option value="pending"><Tag color="orange">{tOrder('pending')}</Tag></Select.Option>
                    <Select.Option value="processing"><Tag color="blue">{tOrder('processing')}</Tag></Select.Option>
                    <Select.Option value="completed"><Tag color="green">{tOrder('completed')}</Tag></Select.Option>
                    <Select.Option value="failed"><Tag color="red">{tOrder('failed')}</Tag></Select.Option>
                    <Select.Option value="cancelled"><Tag color="default">{tOrder('cancelled')}</Tag></Select.Option>
                </Select>
            ),
        },
        {
            title: t('provider'),
            dataIndex: 'provider',
            key: 'provider',
            render: (provider: string) => <Tag>{provider}</Tag>,
        },
        {
            title: t('createdAt'),
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: t('actions'),
            key: 'actions',
            render: (_: any, record: Order) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
                    {t('viewDetails')}
                </Button>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>{t('orders')}</Title>
                <Paragraph type="secondary">{t('ordersSubtitle')}</Paragraph>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Space>
                    <Select
                        placeholder={t('filterByStatus')}
                        value={statusFilter}
                        onChange={(val) => { setStatusFilter(val); setPage(1); }}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Select.Option value="pending">{tOrder('pending')}</Select.Option>
                        <Select.Option value="processing">{tOrder('processing')}</Select.Option>
                        <Select.Option value="completed">{tOrder('completed')}</Select.Option>
                        <Select.Option value="failed">{tOrder('failed')}</Select.Option>
                        <Select.Option value="cancelled">{tOrder('cancelled')}</Select.Option>
                    </Select>
                    <Select
                        placeholder={t('filterByType')}
                        value={typeFilter}
                        onChange={(val) => { setTypeFilter(val); setPage(1); }}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Select.Option value="subscription">{tOrder('subscription')}</Select.Option>
                        <Select.Option value="credits">{tOrder('credits')}</Select.Option>
                        <Select.Option value="product">{t('product')}</Select.Option>
                    </Select>
                </Space>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        onChange: setPage,
                    }}
                />
            </Card>

            <Modal
                title={t('orderDetails')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={<Button onClick={() => setModalOpen(false)}>{t('close')}</Button>}
                width={700}
            >
                {selectedOrder && (
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label={t('orderId')} span={2}>
                            <Text copyable>{selectedOrder.id}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('type')}>
                            <Tag color={getTypeColor(selectedOrder.type)}>{tOrder(selectedOrder.type)}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('status')}>
                            <Tag color={getStatusColor(selectedOrder.status)}>{tOrder(selectedOrder.status)}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('amount')}>
                            ${(selectedOrder.amount_cents / 100).toFixed(2)} {selectedOrder.currency}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('provider')}>
                            {selectedOrder.provider}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('createdAt')}>
                            {new Date(selectedOrder.created_at).toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('completedAt')}>
                            {selectedOrder.completed_at ? new Date(selectedOrder.completed_at).toLocaleString() : '-'}
                        </Descriptions.Item>
                        {selectedOrder.order_items?.length > 0 && (
                            <Descriptions.Item label={t('orderItems')} span={2}>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    {selectedOrder.order_items.map(item => (
                                        <li key={item.id}>
                                            {item.product_name} × {item.quantity} = ${(item.total_price_cents / 100).toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            </Descriptions.Item>
                        )}
                        {selectedOrder.shipping_address && (
                            <Descriptions.Item label={t('shippingAddress')} span={2}>
                                {selectedOrder.shipping_address.full_name}, {selectedOrder.shipping_address.address_line1}, {selectedOrder.shipping_address.city}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
}
