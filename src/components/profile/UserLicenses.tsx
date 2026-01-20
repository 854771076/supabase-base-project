'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, Space, App, Card, Empty } from 'antd';
import { CopyOutlined, CheckCircleOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Text } = Typography;

interface LicenseKey {
    id: string;
    key_value: string;
    status: string;
    expires_at: string | null;
    created_at: string;
    credit_products: {
        name: string;
    } | null;
}

export default function UserLicenses() {
    const [licenses, setLicenses] = useState<LicenseKey[]>([]);
    const [loading, setLoading] = useState(true);
    const { message } = App.useApp();
    const t = useTranslations('Credits');

    useEffect(() => {
        fetch('/api/v1/user/licenses')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setLicenses(data.data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('Key copied to clipboard');
    };

    const columns = [
        {
            title: 'Product',
            key: 'product',
            render: (record: LicenseKey) => (
                <Text strong>{record.credit_products?.name || 'Unknown'}</Text>
            ),
        },
        {
            title: 'License Key',
            dataIndex: 'key_value',
            key: 'key',
            render: (key: string) => (
                <Space>
                    <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>{key}</code>
                    <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(key)}
                    />
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'blue';
                let icon = <CheckCircleOutlined />;
                if (status === 'expired') { color = 'orange'; icon = <ClockCircleOutlined />; }
                if (status === 'revoked') { color = 'red'; icon = <StopOutlined />; }
                return <Tag color={color} icon={icon}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Expires At',
            dataIndex: 'expires_at',
            key: 'expires',
            render: (date: string | null) => <span suppressHydrationWarning>{date ? new Date(date).toLocaleDateString() : 'Lifetime'}</span>,
        },
    ];

    if (!loading && licenses.length === 0) {
        return (
            <Card title="My Licenses" style={{ marginTop: '24px', borderRadius: '12px' }}>
                <Empty description="No licenses found" />
            </Card>
        );
    }

    return (
        <Card title="My Licenses" style={{ marginTop: '24px', borderRadius: '12px' }}>
            <Table
                dataSource={licenses}
                columns={columns}
                loading={loading}
                rowKey="id"
                pagination={false}
                scroll={{ x: 'max-content' }}
            />
        </Card>
    );
}
