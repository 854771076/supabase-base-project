'use client';

import React, { useEffect } from 'react';
import { Modal, Row, Col, Typography, Space, Tag, QRCode, Descriptions, Image, Button, App } from 'antd';
import { WalletOutlined, InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslations, useLocale } from '@/i18n/context';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

interface TokenPayModalProps {
    visible: boolean;
    onCancel: () => void;
    orderId: string;
    metadata: any;
    onSuccess?: () => void;
}

export default function TokenPayModal({ visible, onCancel, orderId, metadata, onSuccess }: TokenPayModalProps) {
    const t = useTranslations('Checkout');
    const locale = useLocale();
    const router = useRouter();
    const { message } = App.useApp();

    const formatLocalizedTime = (utcString: string) => {
        if (!utcString) return '';
        try {
            const date = new Date(utcString.replace(' ', 'T') + 'Z');
            return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch (e) {
            return utcString;
        }
    };

    // Polling for order status
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (visible && orderId) {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/v1/payments/orders/${orderId}`);
                    const data = await response.json();

                    if (data.success && data.order.status === 'completed') {
                        message.success(t('successTitle'));
                        if (onSuccess) {
                            onSuccess();
                        } else {
                            onCancel();
                            router.push(`/${locale}/orders/${orderId}`);
                        }
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [visible, orderId, t, message, locale, router, onCancel, onSuccess]);

    if (!metadata) return null;

    return (
        <Modal
            title={<Space><WalletOutlined style={{ color: '#1677ff' }} />{t('paymentInfo')}</Space>}
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>
                    {t('close')}
                </Button>,
                <Button key="orders" type="primary" onClick={() => router.push(`/${locale}/orders`)}>
                    {t('viewOrders')}
                </Button>
            ]}
            width={700}
            centered
            styles={{ body: { padding: '24px' } }}
        >
            <Row gutter={24}>
                <Col xs={24} md={10} style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '12px', display: 'inline-block' }}>
                        {metadata.QrCodeLink ? (
                            <Image src={metadata.QrCodeLink} width={220} height={220} preview={false} alt="QR Code" />
                        ) : (
                            <QRCode value={metadata.ToAddress} size={220} bordered={false} />
                        )}
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <Text type="secondary">{t('scanToPay')}</Text>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                        <Tag color="blue" icon={<LoadingOutlined />}>Waiting for payment...</Tag>
                    </div>
                </Col>
                <Col xs={24} md={14}>
                    <Descriptions column={1} bordered size="small" labelStyle={{ width: '100px', fontWeight: 'bold' }}>
                        <Descriptions.Item label={t('amount')}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text strong style={{ fontSize: '20px', color: '#1677ff' }}>
                                    {metadata.Amount} {metadata.CurrencyName}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    ≈ {metadata.ActualAmount} {metadata.BaseCurrency}
                                </Text>
                            </div>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('network')}>
                            <Tag color="gold">{metadata.BlockChainName}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('address')}>
                            <Text copyable code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{metadata.ToAddress}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderId')}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{metadata.Id}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('expires')}>
                            <Text type="danger" style={{ fontSize: '12px' }}>{formatLocalizedTime(metadata.ExpireTime)}</Text>
                        </Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: '16px', padding: '12px', background: '#fff7e6', border: '1px solid #ffe7ba', borderRadius: '8px' }}>
                        <Space align="start">
                            <InfoCircleOutlined style={{ color: '#faad14', marginTop: '4px' }} />
                            <Text type="warning" style={{ fontSize: '12px' }}>
                                {t('tokenPayWarning')}
                            </Text>
                        </Space>
                    </div>
                </Col>
            </Row>
        </Modal>
    );
}
