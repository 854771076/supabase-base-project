'use client';

import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Space, Button, Input, Modal, Form, Select, DatePicker, message, Popconfirm, App } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

interface Subscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    current_period_end: string | null;
    created_at: string;
    plans: { id: string; name: string } | null;
    profile: { id: string; email: string } | null;
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
    const [searchId, setSearchId] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    const handleEdit = (sub: Subscription) => {
        setEditingSub(sub);
        form.setFieldsValue({
            plan_id: sub.plan_id,
            status: sub.status,
            current_period_end: sub.current_period_end ? dayjs(sub.current_period_end) : null,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/admin/subscriptions/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success(t('deleteSuccess'));
                fetchSubscriptions();
            } else {
                message.error(data.error || t('error'));
            }
        } catch (error) {
            message.error(t('error'));
        }
    };

    const handleSubmit = async (values: any) => {
        if (!editingSub) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/admin/subscriptions/${editingSub.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...values,
                    current_period_end: values.current_period_end?.toISOString(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(t('updateSuccess'));
                setModalOpen(false);
                fetchSubscriptions();
            } else {
                message.error(data.error || t('error'));
            }
        } catch (error) {
            message.error(t('error'));
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            title: t('user'),
            key: 'user',
            render: (_: any, record: Subscription) => (
                <div>
                    <div>{record.profile?.email || '-'}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.user_id}</Text>
                </div>
            ),
        },
        {
            title: t('plan'),
            key: 'plan',
            render: (_: any, record: Subscription) => (
                <Tag color="blue">{record.plans?.name || record.plan_id}</Tag>
            ),
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors: Record<string, string> = {
                    active: 'green',
                    cancelled: 'orange',
                    expired: 'red',
                    past_due: 'volcano',
                };
                return <Tag color={colors[status] || 'default'}>{t(status)}</Tag>;
            },
        },
        {
            title: t('periodEnd'),
            dataIndex: 'current_period_end',
            key: 'period_end',
            responsive: ['sm'] as any,
            render: (date: string) => date ? <span suppressHydrationWarning>{new Date(date).toLocaleDateString()}</span> : '-',
        },
        {
            title: t('actions'),
            key: 'actions',
            fixed: 'right' as any,
            render: (_: any, record: Subscription) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        {isMobile ? '' : t('edit')}
                    </Button>
                    <Popconfirm title={t('confirmDelete')} onConfirm={() => handleDelete(record.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{t('subscriptions')}</Title>
                    <Paragraph type="secondary">{t('subscriptionsSubtitle')}</Paragraph>
                </div>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Input
                    placeholder={t('searchByUserId')}
                    prefix={<SearchOutlined />}
                    allowClear
                    value={searchId}
                    onChange={(e) => { setSearchId(e.target.value); setPage(1); }}
                    style={{ width: 300, maxWidth: '100%' }}
                />
            </Card>

            <Card styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Table
                    columns={columns}
                    dataSource={subscriptions}
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
                title={t('editSubscription')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={saving}
                width="100%"
                style={{ maxWidth: 500 }}
                footer={[
                    <Button key="back" onClick={() => setModalOpen(false)}>
                        {t('cancel')}
                    </Button>,
                    <Button key="submit" type="primary" loading={saving} onClick={() => form.submit()}>
                        {t('update')}
                    </Button>,
                ]}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="plan_id" label={t('plan')} rules={[{ required: true }]}>
                        <Select>
                            {/* In a real app, fetch plans from API */}
                            {plans.map(plan => (
                                <Select.Option key={plan.id} value={plan.id}>{plan.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="status" label={t('status')} rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="active">{t('active')}</Select.Option>
                            <Select.Option value="cancelled">{t('cancelled')}</Select.Option>
                            <Select.Option value="expired">{t('expired')}</Select.Option>
                            <Select.Option value="past_due">{t('past_due')}</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="current_period_end" label={t('periodEnd')}>
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
