'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Card, Input, Modal, Form, InputNumber, App, Popconfirm, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph } = Typography;

interface CreditProduct {
    id: string;
    name: string;
    credits_amount: number;
    price_cents: number;
    type: 'credits' | 'license';
    duration_days: number;
    created_at: string;
}

export default function AdminCreditProductsPage() {
    const t = useTranslations('Admin');
    const { message } = App.useApp();

    const [products, setProducts] = useState<CreditProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<CreditProduct | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/admin/credit-products');
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error('Error fetching credit products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreate = () => {
        setEditingProduct(null);
        form.resetFields();
        form.setFieldsValue({
            credits_amount: 0,
            price_cents: 0,
            type: 'credits',
            duration_days: 0,
        });
        setModalOpen(true);
    };

    const handleEdit = (product: CreditProduct) => {
        setEditingProduct(product);
        form.setFieldsValue(product);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/admin/credit-products/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success(t('deleteSuccess'));
                fetchProducts();
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
            const method = editingProduct ? 'PUT' : 'POST';
            const url = editingProduct ? `/api/v1/admin/credit-products/${editingProduct.id}` : '/api/v1/admin/credit-products';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();

            if (data.success) {
                message.success(editingProduct ? t('updateSuccess') : t('createSuccess'));
                setModalOpen(false);
                fetchProducts();
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
            title: t('name'),
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <strong>{name}</strong>,
        },
        {
            title: t('type'),
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color={type === 'license' ? 'purple' : 'blue'}>{type.toUpperCase()}</Tag>,
        },
        {
            title: t('credits'),
            dataIndex: 'credits_amount',
            key: 'credits',
            responsive: ['sm'] as any,
        },
        {
            title: t('price'),
            dataIndex: 'price_cents',
            key: 'price',
            render: (cents: number) => `$${(cents / 100).toFixed(2)}`,
        },
        {
            title: t('duration'),
            dataIndex: 'duration_days',
            key: 'duration',
            responsive: ['md'] as any,
            render: (days: number, record: CreditProduct) => record.type === 'license' ? (days === 0 ? t('never') : days) : '-',
        },
        {
            title: t('actions'),
            key: 'actions',
            fixed: 'right' as any,
            render: (_: any, record: CreditProduct) => (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{t('creditProducts')}</Title>
                    <Paragraph type="secondary">{t('creditProductsSubtitle')}</Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    {t('addProduct')}
                </Button>
            </div>

            <Card styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                title={editingProduct ? t('editProduct') : t('addProduct')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={saving}
                width="100%"
                style={{ maxWidth: 500 }}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="name" label={t('productName')} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="type" label={t('type')} rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="credits">{t('credits')}</Select.Option>
                            <Select.Option value="license">{t('license')}</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                    >
                        {({ getFieldValue }) => {
                            const type = getFieldValue('type');
                            return type === 'credits' ? (
                                <Form.Item name="credits_amount" label={t('creditsAmount')} rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            ) : (
                                <Form.Item name="duration_days" label={t('durationDays')} rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>
                    <Form.Item name="price_cents" label={t('priceCents')} rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
