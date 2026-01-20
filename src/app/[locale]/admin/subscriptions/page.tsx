'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, Card, Input, Modal, Form, Select, App, Popconfirm, DatePicker } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

interface Subscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    current_period_end: string | null;
    created_at: string;
    plans: { id: string; name: string } | null;
    user: { id: string; email: string } | null;
}

interface Plan {
    id: string;
    name: string;
}

export default function AdminSubscriptionsPage() {
    const t = useTranslations('Admin');
    const { message } = App.useApp();

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const pageSize = 10;

    const fetchSubscriptions = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: pageSize.toString(),
                offset: ((page - 1) * pageSize).toString(),
            });
            if (search) params.set('search', search);

            const res = await fetch(`/api/v1/admin/subscriptions?${params}`);
            const data = await res.json();
            if (data.success) {
                setSubscriptions(data.data);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/v1/admin/plans');
            const data = await res.json();
            if (data.success) {
                setPlans(data.data);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleEdit = (sub: Subscription) => {
        setEditingSub(sub);
        form.setFieldsValue({
            ...sub,
            current_period_end: sub.current_period_end ? dayjs(sub.current_period_end) : null,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/admin/subscriptions/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success('Subscription deleted successfully');
                fetchSubscriptions();
            } else {
                message.error(data.error || 'Failed to delete subscription');
            }
        } catch (error) {
            message.error('An error occurred');
        }
    };

    const handleSubmit = async (values: any) => {
        setSaving(true);
        try {
            const formattedValues = {
                ...values,
                current_period_end: values.current_period_end ? values.current_period_end.toISOString() : null,
            };

            const res = await fetch(`/api/v1/admin/subscriptions/${editingSub?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedValues),
            });
            const data = await res.json();

            if (data.success) {
                message.success('Subscription updated successfully');
                setModalOpen(false);
                fetchSubscriptions();
            } else {
                message.error(data.error || 'Operation failed');
            }
        } catch (error) {
            message.error('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (_: any, record: Subscription) => (
                <div>
                    <div>{record.user?.email || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{record.user_id}</div>
                </div>
            ),
        },
        {
            title: 'Plan',
            key: 'plan',
            render: (_: any, record: Subscription) => record.plans?.name || 'Unknown',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'active') color = 'green';
                if (status === 'cancelled') color = 'orange';
                if (status === 'expired') color = 'red';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Period End',
            dataIndex: 'current_period_end',
            key: 'period_end',
            render: (date: string) => <span suppressHydrationWarning>{date ? new Date(date).toLocaleString() : '-'}</span>,
        },
        {
            title: t('actions'),
            key: 'actions',
            render: (_: any, record: Subscription) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm title={t('confirmDelete')} onConfirm={() => handleDelete(record.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{t('subscriptions')}</Title>
                    <Paragraph type="secondary">{t('subscriptionsSubtitle')}</Paragraph>
                </div>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Input
                    placeholder="Search by User ID..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ width: 300 }}
                    allowClear
                />
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={subscriptions}
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
                title="Edit Subscription"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={500}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="plan_id" label="Plan" rules={[{ required: true }]}>
                        <Select>
                            {plans.map(plan => (
                                <Select.Option key={plan.id} value={plan.id}>{plan.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="cancelled">Cancelled</Select.Option>
                            <Select.Option value="expired">Expired</Select.Option>
                            <Select.Option value="past_due">Past Due</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="current_period_end" label="Period End">
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                {t('update')}
                            </Button>
                            <Button onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
