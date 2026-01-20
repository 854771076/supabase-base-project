'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Card, Input, Modal, Form, InputNumber, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface Plan {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    features: Record<string, any>;
    quotas: Record<string, any>;
    created_at: string;
}

export default function AdminPlansPage() {
    const t = useTranslations('Admin');
    const { message } = App.useApp();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/admin/plans');
            const data = await res.json();
            if (data.success) {
                setPlans(data.data);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleCreate = () => {
        setEditingPlan(null);
        form.resetFields();
        form.setFieldsValue({
            price_cents: 0,
            features: {},
            quotas: {},
        });
        setModalOpen(true);
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        form.setFieldsValue({
            ...plan,
            features: JSON.stringify(plan.features, null, 2),
            quotas: JSON.stringify(plan.quotas, null, 2),
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/admin/plans/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success(t('deleteSuccess'));
                fetchPlans();
            } else {
                message.error(data.error || t('error'));
            }
        } catch (error) {
            message.error(t('error'));
        }
    };

    const handleSubmit = async (values: any) => {
        setSaving(true);
        try {
            const formattedValues = {
                ...values,
                features: typeof values.features === 'string' ? JSON.parse(values.features) : values.features,
                quotas: typeof values.quotas === 'string' ? JSON.parse(values.quotas) : values.quotas,
            };

            const method = editingPlan ? 'PUT' : 'POST';
            const url = editingPlan ? `/api/v1/admin/plans/${editingPlan.id}` : '/api/v1/admin/plans';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedValues),
            });
            const data = await res.json();

            if (data.success) {
                message.success(editingPlan ? t('updateSuccess') : t('createSuccess'));
                setModalOpen(false);
                fetchPlans();
            } else {
                message.error(data.error || t('error'));
            }
        } catch (error) {
            message.error(t('invalidJson'));
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            title: t('name'),
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <strong>{name}</strong>,
        },
        {
            title: t('price'),
            dataIndex: 'price_cents',
            key: 'price',
            render: (cents: number) => `$${(cents / 100).toFixed(2)}`,
        },
        {
            title: t('createdAt'),
            dataIndex: 'created_at',
            key: 'created_at',
            responsive: ['sm'] as any,
            render: (date: string) => <span suppressHydrationWarning>{new Date(date).toLocaleString()}</span>,
        },
        {
            title: t('actions'),
            key: 'actions',
            fixed: 'right' as any,
            render: (_: any, record: Plan) => (
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
                    <Title level={3} style={{ margin: 0 }}>{t('plans')}</Title>
                    <Paragraph type="secondary">{t('plansSubtitle')}</Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    {t('addPlan')}
                </Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={plans}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                />
            </Card>

            <Modal
                title={editingPlan ? t('editPlan') : t('addPlan')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={saving}
                width="100%"
                style={{ maxWidth: 600 }}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="name" label={t('planName')} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label={t('description')}>
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="price_cents" label={t('priceCents')} rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="features" label={t('featuresJson')} rules={[{ required: true }]}>
                        <TextArea rows={6} placeholder='{"api_access": true}' />
                    </Form.Item>
                    <Form.Item name="quotas" label={t('quotasJson')} rules={[{ required: true }]}>
                        <TextArea rows={6} placeholder='{"daily_requests": 100}' />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
