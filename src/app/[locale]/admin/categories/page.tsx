'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Card, Modal, Form, Input, Switch, App, Popconfirm, Tag, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph } = Typography;

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

export default function AdminCategoriesPage() {
    const t = useTranslations('Admin');
    const { message } = App.useApp();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, [search, statusFilter]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (statusFilter) params.set('is_active', statusFilter);

            const res = await fetch(`/api/v1/admin/categories?${params}`);
            const data = await res.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingCategory(null);
        form.resetFields();
        form.setFieldsValue({ is_active: true, sort_order: 0 });
        setModalOpen(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        form.setFieldsValue(category);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/admin/categories/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success(t('categoryDeleted'));
                fetchCategories();
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
            const method = editingCategory ? 'PUT' : 'POST';
            const url = editingCategory
                ? `/api/v1/admin/categories/${editingCategory.id}`
                : '/api/v1/admin/categories';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();

            if (data.success) {
                message.success(editingCategory ? t('categoryUpdated') : t('categoryCreated'));
                setModalOpen(false);
                fetchCategories();
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
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <Typography.Text copyable code style={{ fontSize: '12px' }}>{id}</Typography.Text>,
        },
        {
            title: t('categoryName'),
            dataIndex: 'name',
            key: 'name',
        },
        // ... (rest of columns)
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{t('categories')}</Title>
                    <Paragraph type="secondary">{t('categoriesSubtitle')}</Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    {t('addCategory')}
                </Button>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Space wrap>
                    <Input
                        placeholder={t('searchCategories')} // You might need to add this key or use generic 'Search'
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 200 }}
                        allowClear
                    />
                    <Select
                        placeholder={t('filterByStatus')}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Select.Option value="true">{t('active')}</Select.Option>
                        <Select.Option value="false">{t('inactive')}</Select.Option>
                    </Select>
                </Space>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={categories}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 800 }}
                />
            </Card>

            <Modal
                title={editingCategory ? t('editCategory') : t('addCategory')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width="100%"
                style={{ maxWidth: 520 }}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="name" label={t('categoryName')} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="slug" label={t('slug')} rules={[{ required: true, pattern: /^[a-z0-9-]+$/ }]}>
                        <Input placeholder="category-url-slug" />
                    </Form.Item>
                    <Form.Item name="description" label={t('description')}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="sort_order" label={t('sortOrder')}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="is_active" label={t('active')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                {editingCategory ? t('update') : t('create')}
                            </Button>
                            <Button onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
