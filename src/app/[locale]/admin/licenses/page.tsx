'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, Card, Input, Modal, Form, Select, App, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

interface LicenseKey {
    id: string;
    user_id: string;
    product_id: string | null;
    key_value: string;
    status: string;
    expires_at: string | null;
    created_at: string;
    user: { id: string; email: string } | null;
    product: { id: string; name: string } | null;
}

export default function AdminLicensesPage() {
    const t = useTranslations('Admin');
    const { message } = App.useApp();

    const [licenses, setLicenses] = useState<LicenseKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLicense, setEditingLicense] = useState<LicenseKey | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const pageSize = 10;

    const fetchLicenses = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: pageSize.toString(),
                offset: ((page - 1) * pageSize).toString(),
            });
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);

            const res = await fetch(`/api/v1/admin/licenses?${params}`);
            const data = await res.json();
            if (data.success) {
                setLicenses(data.data);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching licenses:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        fetchLicenses();
    }, [fetchLicenses]);

    const handleCreate = () => {
        setEditingLicense(null);
        form.resetFields();
        form.setFieldsValue({
            status: 'active',
            key_value: Math.random().toString(36).substring(2, 15).toUpperCase(),
        });
        setModalOpen(true);
    };

    const handleEdit = (license: LicenseKey) => {
        setEditingLicense(license);
        form.setFieldsValue({
            ...license,
            expires_at: license.expires_at ? dayjs(license.expires_at) : null,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/admin/licenses/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success('License deleted successfully');
                fetchLicenses();
            } else {
                message.error(data.error || 'Failed to delete license');
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
                expires_at: values.expires_at ? values.expires_at.toISOString() : null,
            };

            const method = editingLicense ? 'PUT' : 'POST';
            const url = editingLicense ? `/api/v1/admin/licenses/${editingLicense.id}` : '/api/v1/admin/licenses';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedValues),
            });
            const data = await res.json();

            if (data.success) {
                message.success(editingLicense ? 'License updated successfully' : 'License created successfully');
                setModalOpen(false);
                fetchLicenses();
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
            title: 'Key',
            dataIndex: 'key_value',
            key: 'key',
            render: (key: string) => <Typography.Text copyable code>{key}</Typography.Text>,
        },
        {
            title: 'User',
            key: 'user',
            render: (_: any, record: LicenseKey) => (
                <div>
                    <div>{record.user?.email || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{record.user_id}</div>
                </div>
            ),
        },
        {
            title: 'Product',
            key: 'product',
            render: (_: any, record: LicenseKey) => record.product?.name || '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'active') color = 'green';
                if (status === 'revoked') color = 'red';
                if (status === 'expired') color = 'orange';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Expires At',
            dataIndex: 'expires_at',
            key: 'expires',
            render: (date: string) => <span suppressHydrationWarning>{date ? new Date(date).toLocaleString() : 'Lifetime'}</span>,
        },
        {
            title: t('actions'),
            key: 'actions',
            render: (_: any, record: LicenseKey) => (
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
                    <Title level={3} style={{ margin: 0 }}>{t('licenses')}</Title>
                    <Paragraph type="secondary">{t('licensesSubtitle')}</Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Issue License
                </Button>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Space wrap>
                    <Input
                        placeholder="Search by Key or User ID..."
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        style={{ width: 300 }}
                        allowClear
                    />
                    <Select
                        placeholder="Filter by Status"
                        value={statusFilter}
                        onChange={(val) => { setStatusFilter(val); setPage(1); }}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="revoked">Revoked</Select.Option>
                        <Select.Option value="expired">Expired</Select.Option>
                    </Select>
                </Space>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={licenses}
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
                title={editingLicense ? 'Edit License' : 'Issue License'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={500}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    {!editingLicense && (
                        <>
                            <Form.Item name="user_id" label="User ID" rules={[{ required: true }]}>
                                <Input placeholder="UUID of the user" />
                            </Form.Item>
                            <Form.Item name="product_id" label="Product ID (Optional)">
                                <Input placeholder="UUID of the credit product" />
                            </Form.Item>
                        </>
                    )}
                    <Form.Item name="key_value" label="License Key" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="revoked">Revoked</Select.Option>
                            <Select.Option value="expired">Expired</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="expires_at" label="Expires At (Optional)">
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                {editingLicense ? t('update') : t('create')}
                            </Button>
                            <Button onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
