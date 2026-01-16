'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Card, Modal, Form, Input, Switch, App, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/shop/categories?include_inactive=true');
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

    const handleSubmit = async (values: any) => {
        setSaving(true);
        try {
            // For now, only support create (API doesn't have PUT for categories yet)
            const res = await fetch('/api/v1/shop/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();

            if (data.success) {
                message.success(t('categoryCreated'));
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
            title: t('categoryName'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: t('slug'),
            dataIndex: 'slug',
            key: 'slug',
            render: (slug: string) => <code>{slug}</code>,
        },
        {
            title: t('description'),
            dataIndex: 'description',
            key: 'description',
            render: (desc: string) => desc || '-',
        },
        {
            title: t('status'),
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean) => (
                <Tag color={active ? 'green' : 'default'}>
                    {active ? t('active') : t('inactive')}
                </Tag>
            ),
        },
        {
            title: t('sortOrder'),
            dataIndex: 'sort_order',
            key: 'sort_order',
        },
        {
            title: t('actions'),
            key: 'actions',
            render: (_: any, record: Category) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                </Space>
            ),
        },
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

            <Card>
                <Table
                    columns={columns}
                    dataSource={categories}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                />
            </Card>

            <Modal
                title={editingCategory ? t('editCategory') : t('addCategory')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
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
