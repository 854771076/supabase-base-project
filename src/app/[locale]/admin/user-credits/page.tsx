'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Card, Input, Modal, Form, InputNumber, App, Popconfirm } from 'antd';
import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph } = Typography;

interface UserCredit {
    id: string;
    user_id: string;
    balance: number;
    updated_at: string;
    user: { id: string; email: string } | null;
}

export default function AdminUserCreditsPage() {
    const t = useTranslations('Admin');
    const { message } = App.useApp();

    const [credits, setCredits] = useState<UserCredit[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCredit, setEditingCredit] = useState<UserCredit | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const pageSize = 10;

    const fetchCredits = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: pageSize.toString(),
                offset: ((page - 1) * pageSize).toString(),
            });
            if (search) params.set('search', search);

            const res = await fetch(`/api/v1/admin/user-credits?${params}`);
            const data = await res.json();
            if (data.success) {
                setCredits(data.data);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching user credits:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchCredits();
    }, [fetchCredits]);

    const handleEdit = (credit: UserCredit) => {
        setEditingCredit(credit);
        form.setFieldsValue(credit);
        setModalOpen(true);
    };

    const handleSubmit = async (values: any) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/admin/user-credits/${editingCredit?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();

            if (data.success) {
                message.success('Balance updated successfully');
                setModalOpen(false);
                fetchCredits();
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
            title: 'User',
            key: 'user',
            render: (_: any, record: UserCredit) => (
                <div>
                    <div>{record.user?.email || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{record.user_id}</div>
                </div>
            ),
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            key: 'balance',
            render: (balance: number) => <strong>{balance}</strong>,
        },
        {
            title: 'Last Updated',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date: string) => <span suppressHydrationWarning>{new Date(date).toLocaleString()}</span>,
        },
        {
            title: t('actions'),
            key: 'actions',
            render: (_: any, record: UserCredit) => (
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
                    <Title level={3} style={{ margin: 0 }}>{t('userCredits')}</Title>
                    <Paragraph type="secondary">{t('userCreditsSubtitle')}</Paragraph>
                </div>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Input
                    placeholder="Search by User ID..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ width: 300 }}
                    allowClear
                />
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={credits}
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
                title="Adjust Balance"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={400}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="balance" label="Credit Balance" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                {t('update')}
                            </Button>
                            <Button onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
