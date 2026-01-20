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

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            title: t('time'),
            dataIndex: 'created_at',
            key: 'time',
            render: (date: string) => <span suppressHydrationWarning>{new Date(date).toLocaleString()}</span>,
            width: 180,
        },
        {
            title: t('jobName'),
            dataIndex: 'job_name',
            key: 'job_name',
            responsive: ['sm'] as any,
            render: (name: string) => <Tag color="blue">{name}</Tag>,
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'success') color = 'green';
                if (status === 'failed') color = 'red';
                if (status === 'started') color = 'processing';
                return <Tag color={color}>{t(status)}</Tag>;
            },
        },
        {
            title: t('duration'),
            dataIndex: 'duration_ms',
            key: 'duration',
            responsive: ['md'] as any,
            render: (ms: number | null) => ms ? `${ms}ms` : '-',
        },
        {
            title: t('message'),
            dataIndex: 'message',
            key: 'message',
            responsive: ['lg'] as any,
            ellipsis: true,
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{t('logs')}</Title>
                    <Paragraph type="secondary">{t('logsSubtitle')}</Paragraph>
                </div>
            </div>

            <Card style={{ marginBottom: '16px' }}>
                <Space wrap>
                    <Select
                        placeholder={t('filterByJob')}
                        value={jobFilter}
                        onChange={(val) => { setJobFilter(val); setPage(1); }}
                        style={{ width: 200 }}
                        allowClear
                    >
                        <Select.Option value="sync-pending-orders">Sync Pending Orders</Select.Option>
                        <Select.Option value="cleanup-expired-subscriptions">Cleanup Expired Subscriptions</Select.Option>
                    </Select>
                    <Select
                        placeholder={t('filterByStatus')}
                        value={statusFilter}
                        onChange={(val) => { setStatusFilter(val); setPage(1); }}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Select.Option value="started">{t('started')}</Select.Option>
                        <Select.Option value="success">{t('success')}</Select.Option>
                        <Select.Option value="failed">{t('failed')}</Select.Option>
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
