'use client';

import React from 'react';
import { Dropdown, Button, Space, Tag } from 'antd';
import { SwapOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { useAccount, useSwitchChain, useChainId, useConfig } from 'wagmi';
import { useTranslations } from '@/i18n/context';

export function useNetworkMenuItems() {
    const t = useTranslations('Network');
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const config = useConfig();
    const chains = config.chains;

    const handleNetworkChange = ({ key }: { key: string }) => {
        const targetChainId = parseInt(key);
        if (targetChainId !== chainId) {
            switchChain({ chainId: targetChainId });
        }
    };

    const items = chains.map(chain => ({
        key: chain.id.toString(),
        label: (
            <Space>
                <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: chain.id === 1 ? '#52c41a' : '#faad14',
                    display: 'inline-block'
                }} />
                {chain.name}
                {chain.id === chainId && <CheckOutlined style={{ fontSize: 12, color: '#1890ff' }} />}
            </Space>
        ),
        onClick: () => handleNetworkChange({ key: chain.id.toString() })
    }));

    return { items, handleNetworkChange, chains, currentChainId: chainId };
}

export default function NetworkSwitcher() {
    const t = useTranslations('Network');
    const { isConnected } = useAccount();
    const { isPending } = useSwitchChain();
    const { items, chains, currentChainId } = useNetworkMenuItems();

    // Don't show if wallet not connected
    if (!isConnected) {
        return null;
    }

    const currentChain = chains.find(c => c.id === currentChainId);

    return (
        <Dropdown menu={{ items }} placement="bottomRight" disabled={isPending}>
            <Button
                type="text"
                loading={isPending}
                icon={<SwapOutlined />}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: currentChain?.id === 1 ? 'rgba(82, 196, 26, 0.1)' : 'rgba(250, 173, 20, 0.1)',
                    borderRadius: 6
                }}
            >
                <Space size={4}>
                    <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: currentChain?.id === 1 ? '#52c41a' : '#faad14',
                        display: 'inline-block'
                    }} />
                    {currentChain?.name || t('unknown')}
                    <DownOutlined style={{ fontSize: 10 }} />
                </Space>
            </Button>
        </Dropdown>
    );
}
