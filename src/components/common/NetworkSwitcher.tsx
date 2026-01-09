'use client';

import React from 'react';
import { Dropdown, Button, Space, Tag } from 'antd';
import { SwapOutlined, DownOutlined } from '@ant-design/icons';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { useTranslations } from '@/i18n/context';

const chains = [mainnet, sepolia];

export default function NetworkSwitcher() {
    const t = useTranslations('Network');
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain, isPending } = useSwitchChain();

    // Don't show if wallet not connected
    if (!isConnected) {
        return null;
    }

    const currentChain = chains.find(c => c.id === chainId);

    const handleNetworkChange = ({ key }: { key: string }) => {
        const targetChainId = parseInt(key);
        if (targetChainId !== chainId) {
            switchChain({ chainId: targetChainId });
        }
    };

    const networkMenu = {
        items: chains.map(chain => ({
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
                    {chain.id === chainId && <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>{t('current')}</Tag>}
                </Space>
            ),
        })),
        onClick: handleNetworkChange,
    };

    return (
        <Dropdown menu={networkMenu} placement="bottomRight" disabled={isPending}>
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
