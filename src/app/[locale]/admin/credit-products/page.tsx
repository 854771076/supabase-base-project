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
                message.success('Product deleted successfully');
                fetchProducts();
            } else {
                message.error(data.error || 'Failed to delete product');
            }
        } catch (error) {
            message.error('An error occurred');
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
                message.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
                setModalOpen(false);
                fetchProducts();
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
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <strong>{name}</strong>,
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color={type === 'license' ? 'purple' : 'blue'}>{type.toUpperCase()}</Tag>,
        },
        {
            title: 'Credits',
            dataIndex: 'credits_amount',
            key: 'credits',
        },
        {
            title: 'Price',
            dataIndex: 'price_cents',
            key: 'price',
            render: (cents: number) => `$${(cents / 100).toFixed(2)}`,
        },
        {
            title: 'Duration (Days)',
            dataIndex: 'duration_days',
            key: 'duration',
            render: (days: number, record: CreditProduct) => record.type === 'license' ? (days === 0 ? 'Lifetime' : days) : '-',
        },
        {
            title: t('actions'),
            key: 'actions',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{t('creditProducts')}</Title>
                    <Paragraph type="secondary">{t('creditProductsSubtitle')}</Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Add Product
                </Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                />
            </Card>

            <Modal
                title={editingProduct ? 'Edit Product' : 'Add Product'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={500}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="credits">Credits</Select.Option>
                            <Select.Option value="license">License</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                    >
                        {({ getFieldValue }) => {
                            const type = getFieldValue('type');
                            return type === 'credits' ? (
                                <Form.Item name="credits_amount" label="Credits Amount" rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            ) : (
                                <Form.Item name="duration_days" label="Duration (Days, 0 for lifetime)" rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>
                    <Form.Item name="price_cents" label="Price (cents)" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                {editingProduct ? t('update') : t('create')}
                            </Button>
                            <Button onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
