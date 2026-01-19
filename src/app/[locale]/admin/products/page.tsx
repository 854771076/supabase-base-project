'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, Card, Input, Select, Modal, Form, InputNumber, Switch, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface Product {
    id: string;
    name: string;
    slug: string;
    price_cents: number;
    compare_at_price_cents: number | null;
    thumbnail_url: string | null;
    images: string[];
    stock_quantity: number;
    sku: string | null;
    status: 'draft' | 'published' | 'archived';
    category: { id: string; name: string } | null;
    featured: boolean;
    created_at: string;
}

interface Category {
    id: string;
    name: string;
}

export default function AdminProductsPage() {
    const t = useTranslations('Admin');
    const { message } = App.useApp();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const pageSize = 10;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchProducts = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: pageSize.toString(),
                offset: ((page - 1) * pageSize).toString(),
            });
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);

            const res = await fetch(`/api/v1/admin/products?${params}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/v1/admin/categories');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleCreate = () => {
        setEditingProduct(null);
        form.resetFields();
        form.setFieldsValue({
            status: 'draft',
            featured: false,
            stock_quantity: 0,
            price_cents: 0,
        });
        setModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        form.setFieldsValue({
            ...product,
            category_id: product.category?.id,
            images: product.images?.join('\n'),
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/v1/admin/products/${id}`, { method: 'DELETE' });
            message.success(t('productDeleted'));
            fetchProducts();
        } catch (error) {
            message.error(t('error'));
        }
    };

    const handleSubmit = async (values: any) => {
        setSaving(true);
        try {
            const formattedValues = {
                ...values,
                images: values.images ? values.images.split('\n').map((url: string) => url.trim()).filter(Boolean) : [],
            };

            const method = editingProduct ? 'PUT' : 'POST';
            const url = editingProduct
                ? `/api/v1/admin/products/${editingProduct.id}`
                : '/api/v1/admin/products';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedValues),
            });
            const data = await res.json();

            if (data.success) {
                message.success(editingProduct ? t('productUpdated') : t('productCreated'));
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

    const handleStatusChange = async (product: Product, newStatus: string) => {
        try {
            await fetch(`/api/v1/admin/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            message.success(t('statusUpdated'));
            fetchProducts();
        } catch (error) {
            message.error(t('error'));
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <Typography.Text copyable code style={{ fontSize: '12px' }}>{id}</Typography.Text>,
        },
        {
            title: t('productName'),
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: Product) => (
                <div>
                    <div>{name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{record.slug}</div>
                </div>
            ),
        },
        {
            title: t('category'),
            key: 'category',
            render: (_: any, record: Product) => record.category?.name || '-',
        },
        {
            title: t('price'),
            dataIndex: 'price_cents',
            key: 'price',
            render: (cents: number) => `$${(cents / 100).toFixed(2)}`,
        },
        {
            title: t('stock'),
            dataIndex: 'stock_quantity',
            key: 'stock',
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: Product) => (
                <Select
                    value={status}
                    size="small"
                    style={{ width: 100 }}
                    onChange={(val) => handleStatusChange(record, val)}
                >
                    <Select.Option value="draft">
                        <Tag color="default">{t('draft')}</Tag>
                    </Select.Option>
                    <Select.Option value="published">
                        <Tag color="green">{t('published')}</Tag>
                    </Select.Option>
                    <Select.Option value="archived">
                        <Tag color="red">{t('archived')}</Tag>
                    </Select.Option>
                </Select>
            ),
        },
        {
            title: t('featured'),
            dataIndex: 'featured',
            key: 'featured',
            render: (featured: boolean) => featured ? <Tag color="gold">{t('yes')}</Tag> : '-',
        },
        {
            title: t('actions'),
            key: 'actions',
            render: (_: any, record: Product) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title={t('confirmDelete')}
                        onConfirm={() => handleDelete(record.id)}
                    >
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
                    <Title level={3} style={{ margin: 0 }}>{t('products')}</Title>
                    <Paragraph type="secondary">{t('productsSubtitle')}</Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    {t('addProduct')}
                </Button>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Space wrap>
                    <Input
                        placeholder={t('searchProducts')}
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        style={{ width: 200 }}
                        allowClear
                    />
                    <Select
                        placeholder={t('filterByStatus')}
                        value={statusFilter}
                        onChange={(val) => { setStatusFilter(val); setPage(1); }}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Select.Option value="draft">{t('draft')}</Select.Option>
                        <Select.Option value="published">{t('published')}</Select.Option>
                        <Select.Option value="archived">{t('archived')}</Select.Option>
                    </Select>
                </Space>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        onChange: setPage,
                    }}
                />
            </Card>

            <Modal
                title={editingProduct ? t('editProduct') : t('addProduct')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width="100%"
                style={{ maxWidth: 600 }}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="name" label={t('productName')} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="slug" label={t('slug')} rules={[{ required: true, pattern: /^[a-z0-9-]+$/ }]}>
                        <Input placeholder="product-url-slug" />
                    </Form.Item>
                    <Form.Item name="short_description" label={t('shortDescription')}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label={t('description')}>
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="price_cents" label={t('priceCents')} rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="compare_at_price_cents" label={t('compareAtPriceCents')}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="category_id" label={t('category')}>
                        <Select allowClear>
                            {categories.map(cat => (
                                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="stock_quantity" label={t('stockQuantity')}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="sku" label={t('sku')}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="thumbnail_url" label={t('thumbnailUrl')}>
                        <Input placeholder="https://..." />
                    </Form.Item>
                    <Form.Item name="images" label={t('productImages')} tooltip={t('imagesTooltip')}>
                        <TextArea rows={4} placeholder="Enter image URLs, one per line" />
                    </Form.Item>
                    <Form.Item name="status" label={t('status')}>
                        <Select>
                            <Select.Option value="draft">{t('draft')}</Select.Option>
                            <Select.Option value="published">{t('published')}</Select.Option>
                            <Select.Option value="archived">{t('archived')}</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="featured" label={t('featured')} valuePropName="checked">
                        <Switch />
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
