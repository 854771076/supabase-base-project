'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, Card, Input, Modal, Form, Select, message, Popconfirm, DatePicker, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

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

    const [isMobile, setIsMobile] = useState(false);

    const pageSize = 10;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
    }, [page, search, statusFilter, pageSize]);

    useEffect(() => {
        fetchLicenses();
    }, [fetchLicenses]);

    const handleIssue = () => {
        setEditingLicense(null);
        form.resetFields();
        setModalOpen(true);
    };

    const handleEdit = (license: LicenseKey) => {
        setEditingLicense(license);
        form.setFieldsValue({
            ...license,
            key: license.key_value,
            expires_at: license.expires_at ? dayjs(license.expires_at) : null,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/admin/licenses/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success(t('deleteSuccess'));
                fetchLicenses();
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
                key_value: values.key,
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
                message.success(editingLicense ? t('updateSuccess') : t('createSuccess'));
                setModalOpen(false);
                fetchLicenses();
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
            title: t('key'),
            dataIndex: 'key_value',
            key: 'key',
            render: (key: string) => <Text copyable code style={{ fontSize: '12px' }}>{key}</Text>,
        },
        {
            title: t('user'),
            key: 'user',
            responsive: ['sm'] as any,
            render: (_: any, record: LicenseKey) => (
                <div>
                    <div>{record.user?.email || '-'}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.user_id}</Text>
                </div>
            ),
        },
        {
            title: t('product'),
            key: 'product',
            responsive: ['md'] as any,
            render: (_: any, record: LicenseKey) => record.product?.name || record.product_id || '-',
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors: Record<string, string> = {
                    active: 'green',
                    revoked: 'red',
                    expired: 'orange',
                };
                return <Tag color={colors[status] || 'default'}>{t(status)}</Tag>;
            },
        },
        {
            title: t('expiresAt'),
            dataIndex: 'expires_at',
            key: 'expires_at',
            responsive: ['lg'] as any,
            render: (date: string) => date ? <span suppressHydrationWarning>{new Date(date).toLocaleDateString()}</span> : t('never'),
        },
        {
            title: t('actions'),
            key: 'actions',
            fixed: 'right' as any,
            render: (_: any, record: LicenseKey) => (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{t('licenses')}</Title>
                    <Paragraph type="secondary">{t('licensesSubtitle')}</Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleIssue}>
                    {t('issueLicense')}
                </Button>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Space wrap>
                    <Input
                        placeholder={t('searchLicense')}
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        style={{ width: 250 }}
                        allowClear
                    />
                    <Select
                        placeholder={t('filterByStatus')}
                        value={statusFilter}
                        onChange={(val) => { setStatusFilter(val); setPage(1); }}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Select.Option value="active">{t('active')}</Select.Option>
                        <Select.Option value="revoked">{t('revoked')}</Select.Option>
                        <Select.Option value="expired">{t('expired')}</Select.Option>
                    </Select>
                </Space>
            </Card>

            <Card styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Table
                    columns={columns}
                    dataSource={licenses}
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
                title={editingLicense ? t('editLicense') : t('issueLicense')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={saving}
                width="100%"
                style={{ maxWidth: 500 }}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="user_id" label={t('userId')} rules={[{ required: true }]}>
                        <Input placeholder="UUID" />
                    </Form.Item>
                    <Form.Item name="product_id" label={t('productIdOptional')}>
                        <Input placeholder="UUID" />
                    </Form.Item>
                    <Form.Item name="key" label={t('licenseKey')} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="status" label={t('status')} rules={[{ required: true }]} initialValue="active">
                        <Select>
                            <Select.Option value="active">{t('active')}</Select.Option>
                            <Select.Option value="revoked">{t('revoked')}</Select.Option>
                            <Select.Option value="expired">{t('expired')}</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="expires_at" label={t('expiresAtOptional')}>
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
