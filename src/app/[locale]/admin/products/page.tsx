'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, Card, Input, Select, Modal, Form, Switch, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import VariantManager from '@/components/admin/VariantManager';
import { ProductVariant } from '@/components/shop/types';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface Product {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    status: 'draft' | 'published' | 'archived';
    category: { id: string; name: string } | null;
    featured: boolean;
    created_at: string;
    has_variants?: boolean;
    // Computed from variants
    min_price_cents: number;
    max_price_cents: number;
    total_stock_quantity: number;
    variant_count: number;
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
    const [isMobile, setIsMobile] = useState(false);
    const [form] = Form.useForm();

    // Variant management state
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [managingProductId, setManagingProductId] = useState<string | null>(null);
    const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    const handleManageVariants = async (product: Product) => {
        setManagingProductId(product.id);
        try {
            const res = await fetch(`/api/v1/admin/products/${product.id}/variants`);
            const data = await res.json();
            if (data.success) {
                setProductVariants(data.data);
            }
        } catch (error) {
            console.error('Error fetching variants:', error);
        }
        setVariantModalOpen(true);
    };

    const handleVariantsChange = async () => {
        if (!managingProductId) return;
        try {
            const res = await fetch(`/api/v1/admin/products/${managingProductId}/variants`);
            const data = await res.json();
            if (data.success) {
                setProductVariants(data.data);
            }
        } catch (error) {
            console.error('Error fetching variants:', error);
        }
        fetchProducts(); // Refresh product list
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
            title: t('id'),
            dataIndex: 'id',
            key: 'id',
            responsive: ['md'] as any,
            render: (id: string) => <Typography.Text copyable code style={{ fontSize: '12px' }}>{id}</Typography.Text>,
        },
        {
            title: t('thumbnail'),
            dataIndex: 'thumbnail_url',
            key: 'thumbnail',
            render: (url: string) => url ? <img src={url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /> : '-',
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
            responsive: ['sm'] as any,
            render: (_: any, record: Product) => record.category?.name || '-',
        },
        {
            title: t('price'),
            key: 'price',
            render: (_: any, record: Product) => {
                if (!record.min_price_cents) return '-';
                const min = `$${(record.min_price_cents / 100).toFixed(2)}`;
                return record.min_price_cents !== record.max_price_cents
                    ? `${min} ~ $${(record.max_price_cents / 100).toFixed(2)}`
                    : min;
            },
        },
        {
            title: t('stock'),
            key: 'stock',
            responsive: ['md'] as any,
            render: (_: any, record: Product) => (
                <Tag color={record.total_stock_quantity > 0 ? 'success' : 'error'}>
                    {record.total_stock_quantity}
                </Tag>
            ),
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
            responsive: ['lg'] as any,
            render: (featured: boolean) => featured ? <Tag color="gold">{t('yes')}</Tag> : '-',
        },
        {
            title: t('actions'),
            key: 'actions',
            fixed: 'right' as any,
            render: (_: any, record: Product) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Button size="small" icon={<AppstoreOutlined />} onClick={() => handleManageVariants(record)} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
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

            <Card styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Table
                    columns={columns}
                    dataSource={products}
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
                    <Form.Item name="short_description" label={t('shortDescription')}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label={t('description')}>
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="category_id" label={t('category')}>
                        <Select allowClear>
                            {categories.map(cat => (
                                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="thumbnail_url" label={t('thumbnailUrl')}>
                        <Input placeholder="https://..." />
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

            {/* Variant Management Modal */}
            <Modal
                title={t('manageVariants') || 'Manage Product Variants'}
                open={variantModalOpen}
                onCancel={() => setVariantModalOpen(false)}
                footer={null}
                width={1000}
            >
                {managingProductId && (
                    <VariantManager
                        productId={managingProductId}
                        variants={productVariants}
                        onVariantsChange={handleVariantsChange}
                        t={t}
                    />
                )}
            </Modal>
        </div>
    );
}
