'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Card, Space, Select, App, Collapse } from 'antd';
import { useTranslations } from '@/i18n/context';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface CronJobLog {
    id: string;
    job_name: string;
    status: string;
    message: string | null;
    details: any;
    duration_ms: number | null;
    created_at: string;
}

export default function AdminLogsPage() {
    const t = useTranslations('Admin');

    const [logs, setLogs] = useState<CronJobLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [jobFilter, setJobFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const pageSize = 20;

    const fetchLogs = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: pageSize.toString(),
                offset: ((page - 1) * pageSize).toString(),
            });
            if (jobFilter) params.set('job_name', jobFilter);
            if (statusFilter) params.set('status', statusFilter);

            const res = await fetch(`/api/v1/admin/logs?${params}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, jobFilter, statusFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const columns = [
        {
            title: 'Time',
            dataIndex: 'created_at',
            key: 'time',
            render: (date: string) => <span suppressHydrationWarning>{new Date(date).toLocaleString()}</span>,
            width: 180,
        },
        {
            title: 'Job Name',
            dataIndex: 'job_name',
            key: 'job_name',
            render: (name: string) => <Tag color="blue">{name}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'success') color = 'green';
                if (status === 'failed') color = 'red';
                if (status === 'started') color = 'processing';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Duration',
            dataIndex: 'duration_ms',
            key: 'duration',
            render: (ms: number | null) => ms ? `${ms}ms` : '-',
        },
        {
            title: 'Message',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true,
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>{t('logs')}</Title>
                <Paragraph type="secondary">{t('logsSubtitle')}</Paragraph>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Space wrap>
                    <Select
                        placeholder="Filter by Job"
                        value={jobFilter}
                        onChange={(val) => { setJobFilter(val); setPage(1); }}
                        style={{ width: 200 }}
                        allowClear
                    >
                        <Select.Option value="sync-pending-orders">Sync Pending Orders</Select.Option>
                        <Select.Option value="cleanup-expired-subscriptions">Cleanup Expired Subscriptions</Select.Option>
                    </Select>
                    <Select
                        placeholder="Filter by Status"
                        value={statusFilter}
                        onChange={(val) => { setStatusFilter(val); setPage(1); }}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Select.Option value="started">Started</Select.Option>
                        <Select.Option value="success">Success</Select.Option>
                        <Select.Option value="failed">Failed</Select.Option>
                    </Select>
                </Space>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="id"
                    loading={loading}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <Text strong>Full Message:</Text> <Text>{record.message || 'No message'}</Text>
                                </div>
                                {record.details && (
                                    <div>
                                        <Text strong>Details:</Text>
                                        <pre style={{ marginTop: '8px', fontSize: '12px' }}>
                                            {JSON.stringify(record.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ),
                    }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        onChange: setPage,
                    }}
                />
            </Card>
        </div>
    );
}
