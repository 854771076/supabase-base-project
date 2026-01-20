'use client';

import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Space, Button, Input, Modal, Form, InputNumber, message, App } from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph, Text } = Typography;

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
    const [searchId, setSearchId] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserCredit | null>(null);
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

    const fetchCredits = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: pageSize.toString(),
                offset: ((page - 1) * pageSize).toString(),
            });
            if (searchId) params.set('user_id', searchId);

            const res = await fetch(`/api/v1/admin/user-credits?${params}`);
            const data = await res.json();
            if (data.success) {
                setCredits(data.data);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching credits:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchId, pageSize]);

    useEffect(() => {
        fetchCredits();
    }, [fetchCredits]);

    const handleAdjust = (record: UserCredit) => {
        setSelectedUser(record);
        form.setFieldsValue({ balance: record.balance });
        setModalOpen(true);
    };

    const handleSubmit = async (values: any) => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/admin/user-credits/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (data.success) {
                message.success(t('updateSuccess'));
                setModalOpen(false);
                fetchCredits();
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
            title: t('user'),
            key: 'user',
            render: (_: any, record: UserCredit) => (
                <div>
                    <div>{record.user?.email || '-'}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.user_id}</Text>
                </div>
            ),
        },
        {
            title: t('balance'),
            dataIndex: 'balance',
            key: 'balance',
            render: (balance: number) => <Tag color="blue">{balance}</Tag>,
        },
        {
            title: t('lastUpdated'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            responsive: ['sm'] as any,
            render: (date: string) => <span suppressHydrationWarning>{new Date(date).toLocaleString()}</span>,
        },
        {
            title: t('actions'),
            key: 'actions',
            fixed: 'right' as any,
            render: (_: any, record: UserCredit) => (
                <Button size="small" icon={<EditOutlined />} onClick={() => handleAdjust(record)}>
                    {isMobile ? '' : t('adjustBalance')}
                </Button>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{t('userCredits')}</Title>
                    <Paragraph type="secondary">{t('userCreditsSubtitle')}</Paragraph>
                </div>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Input
                    placeholder={t('searchByUserId')}
                    prefix={<SearchOutlined />}
                    allowClear
                    value={searchId}
                    onChange={(e) => { setSearchId(e.target.value); setPage(1); }}
                    style={{ width: 300, maxWidth: '100%' }}
                />
            </Card>

            <Card styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Table
                    columns={columns}
                    dataSource={credits}
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
                title={t('adjustBalance')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={saving}
                width="100%"
                style={{ maxWidth: 400 }}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="balance" label={t('creditBalance')} rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
