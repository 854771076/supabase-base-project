import React from 'react';
import { Modal, Form, Input, InputNumber, Switch, Button, Space, Typography, Table, Tag, Popconfirm, App } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { ProductVariant } from '@/components/shop/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface VariantManagerProps {
    productId: string;
    variants: ProductVariant[];
    onVariantsChange: () => void;
    t: (key: string) => string;
}

export default function VariantManager({ productId, variants, onVariantsChange, t }: VariantManagerProps) {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editingVariant, setEditingVariant] = React.useState<ProductVariant | null>(null);
    const [saving, setSaving] = React.useState(false);

    const handleCreate = () => {
        setEditingVariant(null);
        form.resetFields();
        form.setFieldsValue({
            is_active: true,
            stock_quantity: 0,
            price_dollars: 0,
            sort_order: variants.length,
        });
        setModalOpen(true);
    };

    const handleEdit = (variant: ProductVariant) => {
        setEditingVariant(variant);
        form.setFieldsValue({
            ...variant,
            price_dollars: variant.price_cents / 100,
            compare_at_price_dollars: variant.compare_at_price_cents ? variant.compare_at_price_cents / 100 : undefined,
            attributes: JSON.stringify(variant.attributes, null, 2),
            images: variant.images?.join('\n'),
        });
        setModalOpen(true);
    };

    const handleDelete = async (variantId: string) => {
        try {
            const res = await fetch(`/api/v1/admin/products/${productId}/variants/${variantId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                message.success(t('variantDeleted') || 'Variant deleted');
                onVariantsChange();
            } else {
                message.error(t('error'));
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
                price_cents: Math.round((values.price_dollars || 0) * 100),
                compare_at_price_cents: values.compare_at_price_dollars
                    ? Math.round(values.compare_at_price_dollars * 100)
                    : null,
                attributes: values.attributes ? JSON.parse(values.attributes) : {},
                images: values.images ? values.images.split('\n').map((url: string) => url.trim()).filter(Boolean) : [],
            };
            delete formattedValues.price_dollars;
            delete formattedValues.compare_at_price_dollars;

            const method = editingVariant ? 'PUT' : 'POST';
            const url = editingVariant
                ? `/api/v1/admin/products/${productId}/variants/${editingVariant.id}`
                : `/api/v1/admin/products/${productId}/variants`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedValues),
            });

            if (res.ok) {
                message.success(editingVariant ? t('variantUpdated') : t('variantCreated'));
                setModalOpen(false);
                onVariantsChange();
            } else {
                const data = await res.json();
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
            title: t('variantName') || 'Variant',
            dataIndex: 'variant_name',
            key: 'variant_name',
            render: (text: string, record: ProductVariant) => (
                <div>
                    <Text strong>{text || Object.values(record.attributes).join(' / ')}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {Object.entries(record.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </Text>
                </div>
            ),
        },
        {
            title: t('sku') || 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            render: (text: string) => text || '-',
        },
        {
            title: t('price') || 'Price',
            dataIndex: 'price_cents',
            key: 'price_cents',
            render: (price: number) => `$${(price / 100).toFixed(2)}`,
        },
        {
            title: t('stock') || 'Stock',
            dataIndex: 'stock_quantity',
            key: 'stock_quantity',
            render: (stock: number) => (
                <Tag color={stock > 0 ? 'success' : 'error'}>{stock}</Tag>
            ),
        },
        {
            title: t('status') || 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean) => (
                <Tag color={active ? 'success' : 'default'}>
                    {active ? t('active') : t('inactive')}
                </Tag>
            ),
        },
        {
            title: t('actions') || 'Actions',
            key: 'actions',
            render: (_: any, record: ProductVariant) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        {t('edit')}
                    </Button>
                    <Popconfirm
                        title={t('confirmDelete')}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            {t('delete')}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={5}>{t('productVariants') || 'Product Variants'}</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    {t('addVariant') || 'Add Variant'}
                </Button>
            </div>

            <Table
                dataSource={variants}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
            />

            <Modal
                title={editingVariant ? t('editVariant') : t('createVariant')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="variant_name" label={t('variantName') || 'Variant Name'}>
                        <Input placeholder="e.g., Red / Large" />
                    </Form.Item>

                    <Form.Item
                        name="attributes"
                        label={t('attributes') || 'Attributes (JSON)'}
                        tooltip='e.g., {"color": "red", "size": "L"}'
                        rules={[
                            {
                                validator: (_: unknown, value: string) => {
                                    if (!value) return Promise.resolve();
                                    try {
                                        JSON.parse(value);
                                        return Promise.resolve();
                                    } catch {
                                        return Promise.reject(new Error('Invalid JSON format'));
                                    }
                                },
                            },
                        ]}
                    >
                        <TextArea rows={3} placeholder='{"color": "red", "size": "L"}' />
                    </Form.Item>

                    <Form.Item name="sku" label={t('sku') || 'SKU'}>
                        <Input placeholder="PROD-RED-L" />
                    </Form.Item>

                    <Form.Item
                        name="price_dollars"
                        label={t('price') || 'Price'}
                        rules={[{ required: true }]}
                    >
                        <InputNumber
                            min={0}
                            precision={2}
                            step={0.01}
                            prefix="$"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item name="compare_at_price_dollars" label={t('compareAtPrice') || 'Compare at Price'}>
                        <InputNumber
                            min={0}
                            precision={2}
                            step={0.01}
                            prefix="$"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="stock_quantity"
                        label={t('stockQuantity') || 'Stock Quantity'}
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="thumbnail_url" label={t('thumbnailUrl') || 'Thumbnail URL'}>
                        <Input placeholder="https://..." />
                    </Form.Item>

                    <Form.Item name="images" label={t('images') || 'Images'} tooltip="One URL per line">
                        <TextArea rows={3} placeholder="https://..." />
                    </Form.Item>

                    <Form.Item name="is_active" label={t('active') || 'Active'} valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item name="sort_order" label={t('sortOrder') || 'Sort Order'}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                {editingVariant ? t('update') : t('create')}
                            </Button>
                            <Button onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
