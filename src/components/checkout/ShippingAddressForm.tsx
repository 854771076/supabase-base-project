'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Typography, Space, Radio, Empty, App } from 'antd';
import { PlusOutlined, HomeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';

const { Text, Title } = Typography;

interface ShippingAddress {
    id: string;
    full_name: string;
    phone: string | null;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string | null;
    postal_code: string;
    country: string;
    is_default: boolean;
}

interface ShippingAddressFormProps {
    onSelect: (addressId: string | null) => void;
    selectedAddressId: string | null;
}

const COUNTRIES = [
    { code: 'CN', name: '中国' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'JP', name: '日本' },
    { code: 'KR', name: '한국' },
    { code: 'SG', name: 'Singapore' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'TW', name: 'Taiwan' },
];

export default function ShippingAddressForm({ onSelect, selectedAddressId }: ShippingAddressFormProps) {
    const t = useTranslations('ShippingAddress');
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchAddresses = React.useCallback(async () => {
        try {
            const res = await fetch('/api/v1/shop/addresses');
            const data = await res.json();
            if (data.success) {
                setAddresses(data.data);
                // Auto-select default or first address
                if (!selectedAddressId && data.data.length > 0) {
                    const defaultAddr = data.data.find((a: ShippingAddress) => a.is_default) || data.data[0];
                    onSelect(defaultAddr.id);
                }
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    }, [onSelect, selectedAddressId]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleSubmit = async (values: any) => {
        setSaving(true);
        try {
            const res = await fetch('/api/v1/shop/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...values,
                    id: editingId || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(editingId ? t('addressUpdated') : t('addressAdded'));
                await fetchAddresses();
                if (!editingId) {
                    onSelect(data.data.id);
                }
                setShowForm(false);
                setEditingId(null);
                form.resetFields();
            } else {
                message.error(data.error || t('error'));
            }
        } catch (error) {
            message.error(t('error'));
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (address: ShippingAddress) => {
        setEditingId(address.id);
        form.setFieldsValue(address);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/v1/shop/addresses?id=${id}`, { method: 'DELETE' });
            setAddresses(prev => prev.filter(a => a.id !== id));
            if (selectedAddressId === id) {
                const remaining = addresses.filter(a => a.id !== id);
                onSelect(remaining.length > 0 ? remaining[0].id : null);
            }
            message.success(t('addressDeleted'));
        } catch (error) {
            message.error(t('error'));
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        form.resetFields();
    };

    return (
        <Card title={<><HomeOutlined /> {t('title')}</>} style={{ marginBottom: '24px', borderRadius: '12px' }}>
            {!showForm ? (
                <>
                    {addresses.length === 0 ? (
                        <Empty description={t('noAddresses')} style={{ margin: '20px 0' }} />
                    ) : (
                        <Radio.Group
                            value={selectedAddressId}
                            onChange={(e) => onSelect(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {addresses.map(addr => (
                                    <Card
                                        key={addr.id}
                                        size="small"
                                        style={{
                                            borderColor: selectedAddressId === addr.id ? '#1677ff' : '#f0f0f0',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => onSelect(addr.id)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Radio value={addr.id} style={{ flex: 1 }}>
                                                <div>
                                                    <Text strong>{addr.full_name}</Text>
                                                    {addr.is_default && (
                                                        <Text type="success" style={{ marginLeft: '8px' }}>[{t('default')}]</Text>
                                                    )}
                                                    {addr.phone && <Text type="secondary" style={{ marginLeft: '12px' }}>{addr.phone}</Text>}
                                                </div>
                                                <div>
                                                    <Text type="secondary">
                                                        {addr.address_line1}
                                                        {addr.address_line2 && `, ${addr.address_line2}`}
                                                        , {addr.city}
                                                        {addr.state && `, ${addr.state}`}
                                                        , {addr.postal_code}
                                                        , {COUNTRIES.find(c => c.code === addr.country)?.name || addr.country}
                                                    </Text>
                                                </div>
                                            </Radio>
                                            <Space size="small">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EditOutlined />}
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(addr); }}
                                                />
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                                                />
                                            </Space>
                                        </div>
                                    </Card>
                                ))}
                            </Space>
                        </Radio.Group>
                    )}

                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => setShowForm(true)}
                        style={{ width: '100%', marginTop: '16px' }}
                    >
                        {t('addNew')}
                    </Button>
                </>
            ) : (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ country: 'CN' }}
                >
                    <Form.Item
                        name="full_name"
                        label={t('fullName')}
                        rules={[{ required: true, message: t('required') }]}
                    >
                        <Input placeholder={t('fullNamePlaceholder')} />
                    </Form.Item>

                    <Form.Item name="phone" label={t('phone')}>
                        <Input placeholder={t('phonePlaceholder')} />
                    </Form.Item>

                    <Form.Item
                        name="address_line1"
                        label={t('addressLine1')}
                        rules={[{ required: true, message: t('required') }]}
                    >
                        <Input placeholder={t('addressLine1Placeholder')} />
                    </Form.Item>

                    <Form.Item name="address_line2" label={t('addressLine2')}>
                        <Input placeholder={t('addressLine2Placeholder')} />
                    </Form.Item>

                    <Form.Item
                        name="city"
                        label={t('city')}
                        rules={[{ required: true, message: t('required') }]}
                    >
                        <Input placeholder={t('cityPlaceholder')} />
                    </Form.Item>

                    <Form.Item name="state" label={t('state')}>
                        <Input placeholder={t('statePlaceholder')} />
                    </Form.Item>

                    <Form.Item
                        name="postal_code"
                        label={t('postalCode')}
                        rules={[{ required: true, message: t('required') }]}
                    >
                        <Input placeholder={t('postalCodePlaceholder')} />
                    </Form.Item>

                    <Form.Item
                        name="country"
                        label={t('country')}
                        rules={[{ required: true, message: t('required') }]}
                    >
                        <Select>
                            {COUNTRIES.map(c => (
                                <Select.Option key={c.code} value={c.code}>{c.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="is_default" valuePropName="checked">
                        <Radio>{t('setAsDefault')}</Radio>
                    </Form.Item>

                    <Space>
                        <Button type="primary" htmlType="submit" loading={saving}>
                            {editingId ? t('update') : t('save')}
                        </Button>
                        <Button onClick={handleCancel}>{t('cancel')}</Button>
                    </Space>
                </Form>
            )}
        </Card>
    );
}
