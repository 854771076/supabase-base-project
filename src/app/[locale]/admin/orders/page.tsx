'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, Card, Select, Modal, Descriptions, App, DatePicker, Input } from 'antd';
import { EyeOutlined, SearchOutlined, SendOutlined, CarOutlined } from '@ant-design/icons';
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
    type: 'subscription' | 'credits' | 'product' | 'license';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    amount_cents: number;
    currency: string;
    provider: string;
    product_name: string | null;
    order_items: OrderItem[];
    shipping_address: any | null;
    tracking_number: string | null;
    tracking_carrier: string | null;
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
    const [searchId, setSearchId] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingCarrier, setTrackingCarrier] = useState('');
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [shippingFilter, setShippingFilter] = useState<string | null>(null);
    const pageSize = 10;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchOrders = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: pageSize.toString(),
                offset: ((page - 1) * pageSize).toString(),
            });
            if (statusFilter) params.set('status', statusFilter);
            if (typeFilter) params.set('type', typeFilter);
            if (searchId) params.set('id', searchId);
            if (shippingFilter) params.set('shipping', shippingFilter);

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
    }, [page, statusFilter, typeFilter, searchId, shippingFilter, pageSize]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/v1/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
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
        setTrackingNumber(order.tracking_number || '');
        setTrackingCarrier(order.tracking_carrier || '');
        setModalOpen(true);
    };

    const handleSaveTracking = async () => {
        if (!selectedOrder) return;
        setTrackingLoading(true);
        try {
            const res = await fetch(`/api/v1/admin/orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracking_number: trackingNumber || null, tracking_carrier: trackingCarrier || null }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(tOrder('trackingUpdated'));
                setSelectedOrder(prev => prev ? { ...prev, tracking_number: trackingNumber || null, tracking_carrier: trackingCarrier || null } : prev);
                fetchOrders();
            } else {
                message.error(data.error || t('error'));
            }
        } catch {
            message.error(t('error'));
        } finally {
            setTrackingLoading(false);
        }
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
            license: 'gold',
        };
        return colors[type] || 'default';
    };

    const columns = [
        {
            title: t('orderId'),
            dataIndex: 'id',
            key: 'id',
            responsive: ['md'] as any,
            render: (id: string) => <Text copyable code style={{ fontSize: '12px' }}>{id}</Text>,
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
            responsive: ['sm'] as any,
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
            title: tOrder('shipping'),
            key: 'shipping',
            responsive: ['sm'] as any,
            render: (_: any, record: Order) => {
                if (record.type !== 'product') return <span style={{ color: '#bfbfbf' }}>—</span>;
                return record.tracking_number
                    ? <Tag icon={<CarOutlined />} color="success">{tOrder('shipped')}</Tag>
                    : <Tag icon={<CarOutlined />} color="default">{tOrder('notShippedYet')}</Tag>;
            },
        },
        {
            title: t('provider'),
            dataIndex: 'provider',
            key: 'provider',
            responsive: ['md'] as any,
            render: (provider: string) => <Tag>{provider}</Tag>,
        },
        {
            title: t('createdAt'),
            dataIndex: 'created_at',
            key: 'created_at',
            responsive: ['lg'] as any,
            render: (date: string) => <span suppressHydrationWarning>{new Date(date).toLocaleString()}</span>,
        },
        {
            title: t('actions'),
            key: 'actions',
            fixed: 'right' as any,
            render: (_: any, record: Order) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
                    {isMobile ? '' : t('viewDetails')}
                </Button>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{t('orders')}</Title>
                    <Paragraph type="secondary">{t('ordersSubtitle')}</Paragraph>
                </div>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Space wrap>
                    <Input
                        placeholder={t('searchOrderId')}
                        prefix={<SearchOutlined />}
                        allowClear
                        value={searchId}
                        onChange={(e) => { setSearchId(e.target.value); setPage(1); }}
                        style={{ width: 200 }}
                    />
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
                        <Select.Option value="license">{tOrder('license')}</Select.Option>
                    </Select>
                    <Select
                        placeholder={tOrder('filterByShipping')}
                        value={shippingFilter}
                        onChange={(val) => { setShippingFilter(val); setPage(1); }}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Select.Option value="shipped">{tOrder('shipped')}</Select.Option>
                        <Select.Option value="notShipped">{tOrder('notShippedYet')}</Select.Option>
                    </Select>
                </Space>
            </Card>

            <Card styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        onChange: setPage,
                        size: isMobile ? 'small' : 'default',
                    }}
                />
            </Card>

            <Modal
                title={t('orderDetails')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={<Button onClick={() => setModalOpen(false)}>{t('close')}</Button>}
                width="100%"
                style={{ maxWidth: 700 }}
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 8 } }}
            >
                {selectedOrder && (
                    <div>
                        <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 130 }} contentStyle={{ fontWeight: 500 }}>
                            <Descriptions.Item label={t('orderId')}>
                                <Text copyable style={{ fontSize: 12 }}>{selectedOrder.id}</Text>
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
                                <span suppressHydrationWarning>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('completedAt')}>
                                <span suppressHydrationWarning>{selectedOrder.completed_at ? new Date(selectedOrder.completed_at).toLocaleString() : '-'}</span>
                            </Descriptions.Item>
                            {selectedOrder.order_items?.length > 0 && (
                                <Descriptions.Item label={t('orderItems')}>
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
                                <Descriptions.Item label={t('shippingAddress')}>
                                    {selectedOrder.shipping_address.full_name}, {selectedOrder.shipping_address.address_line1}, {selectedOrder.shipping_address.city}
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {/* Tracking section — only for product orders */}
                        {selectedOrder.type === 'product' && (
                            <div style={{ marginTop: 20, padding: '16px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                                <div style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <SendOutlined style={{ color: '#1677ff' }} />
                                    {tOrder('shippingTracking')}
                                </div>
                                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                    <Input
                                        placeholder={tOrder('trackingCarrierPlaceholder')}
                                        value={trackingCarrier}
                                        onChange={e => setTrackingCarrier(e.target.value)}
                                        prefix={<span style={{ color: '#8c8c8c', fontSize: 12 }}>{tOrder('trackingCarrier')}:</span>}
                                    />
                                    <Input
                                        placeholder={tOrder('trackingNumberPlaceholder')}
                                        value={trackingNumber}
                                        onChange={e => setTrackingNumber(e.target.value)}
                                        prefix={<span style={{ color: '#8c8c8c', fontSize: 12 }}>{tOrder('trackingNumber')}:</span>}
                                    />
                                    <Button
                                        type="primary"
                                        size="small"
                                        loading={trackingLoading}
                                        onClick={handleSaveTracking}
                                        icon={<SendOutlined />}
                                    >
                                        {t('save')}
                                    </Button>
                                </Space>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
