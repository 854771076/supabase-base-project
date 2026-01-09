'use client';

import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, Spin, App, Modal, List, Avatar } from 'antd';
import { WalletOutlined, QrcodeOutlined, LoginOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useAccount, useConnect, useDisconnect, useSignMessage, useConnectors } from 'wagmi';
import { createClient } from '@/utils/supabase/client';
import { useTranslations } from '@/i18n/context';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

export default function WalletLogin() {
    const t = useTranslations('Wallet');
    const router = useRouter();
    const supabase = createClient();
    const { message } = App.useApp();

    const { address, isConnected } = useAccount();
    const { connect, isPending: isConnecting, error: connectError } = useConnect();
    const { disconnect } = useDisconnect();
    const { signMessageAsync, isPending: isSigning } = useSignMessage();
    const connectors = useConnectors();

    const [isVerifying, setIsVerifying] = useState(false);
    const [nonce, setNonce] = useState<string | null>(null);

    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

    // Filter connectors
    const injectedConnectors = connectors.filter(c => c.type === 'injected');
    const walletConnectConnector = connectors.find(c => c.type === 'walletConnect');

    // Log connection errors
    useEffect(() => {
        if (connectError) {
            console.error('Connect error:', connectError);
            if ((connectError as any).name === 'ProviderNotFoundError') {
                message.error('No wallet found. Please install MetaMask.');
            } else {
                message.error(connectError.message || t('error'));
            }
        }
    }, [connectError]);

    // Fetch nonce when connected
    useEffect(() => {
        if (isConnected && address) {
            fetchNonce();
            setIsWalletModalOpen(false);
        }
    }, [isConnected, address]);

    const fetchNonce = async () => {
        try {
            const response = await fetch('/api/v1/auth/web3/nonce');
            const data = await response.json();
            setNonce(data.nonce);
        } catch (error) {
            console.error('Failed to fetch nonce:', error);
            message.error(t('error'));
        }
    };

    const handleBrowserWalletConnect = () => {
        if (injectedConnectors.length === 0) {
            message.error('No browser wallet detected. Please install MetaMask or OKX Wallet.');
            return;
        }

        if (injectedConnectors.length === 1) {
            connect({ connector: injectedConnectors[0] });
        } else {
            setIsWalletModalOpen(true);
        }
    };

    const handleWalletConnectConnect = () => {
        if (!walletConnectConnector) {
            message.error('WalletConnect not configured');
            return;
        }
        connect({ connector: walletConnectConnector });
    };

    const handleSignIn = async () => {
        if (!address || !nonce) {
            message.error('Please connect wallet first');
            return;
        }

        try {
            setIsVerifying(true);

            // Create SIWE message
            const domain = window.location.host;
            const origin = window.location.origin;
            const statement = 'Sign in with Ethereum to the app.';

            const siweMessage = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

            // Sign the message
            const signature = await signMessageAsync({ message: siweMessage });

            // Verify signature and create session
            const verifyResponse = await fetch('/api/v1/auth/web3/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: siweMessage,
                    signature,
                }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
                throw new Error(verifyData.error || 'Verification failed');
            }

            // Verify the token with Supabase
            if (verifyData.verification?.token) {
                const { data, error } = await supabase.auth.verifyOtp({
                    token_hash: verifyData.verification.token,
                    type: 'magiclink',
                });

                if (error) {
                    throw error;
                }

                message.success('Successfully signed in!');
                router.push('/');
            } else {
                throw new Error('No verification token received');
            }

        } catch (error: any) {
            console.error('Sign in error:', error);
            message.error(error.message || t('error'));
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setNonce(null);
    };

    const isLoading = isConnecting || isSigning || isVerifying;

    if (isConnected && address) {
        return (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{
                    padding: '12px 16px',
                    background: '#f6ffed',
                    borderRadius: '8px',
                    border: '1px solid #b7eb8f'
                }}>
                    <Space>
                        <WalletOutlined style={{ color: '#52c41a' }} />
                        <Text strong>{t('connected')}: </Text>
                        <Text code style={{ fontSize: '12px' }}>
                            {address.slice(0, 6)}...{address.slice(-4)}
                        </Text>
                    </Space>
                </div>

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Button
                        type="primary"
                        icon={isLoading ? <Spin size="small" /> : <LoginOutlined />}
                        onClick={handleSignIn}
                        loading={isLoading}
                        block
                        size="large"
                        disabled={!nonce}
                    >
                        {isSigning ? t('signing') : isVerifying ? t('verifying') : t('signIn')}
                    </Button>

                    <Button
                        icon={<DisconnectOutlined />}
                        onClick={handleDisconnect}
                        block
                    >
                        {t('disconnect')}
                    </Button>
                </Space>
            </Space>
        );
    }

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
                icon={<WalletOutlined />}
                onClick={handleBrowserWalletConnect}
                loading={isConnecting}
                block
                size="large"
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderColor: 'transparent',
                    color: 'white'
                }}
            >
                {t('connectBrowser')}
            </Button>

            <Button
                icon={<QrcodeOutlined />}
                onClick={handleWalletConnectConnect}
                loading={isConnecting}
                block
                size="large"
                style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderColor: 'transparent',
                    color: 'white'
                }}
            >
                {t('connectWalletConnect')}
            </Button>

            <Modal
                title="Select Wallet"
                open={isWalletModalOpen}
                onCancel={() => setIsWalletModalOpen(false)}
                footer={null}
            >
                <List
                    itemLayout="horizontal"
                    dataSource={injectedConnectors}
                    renderItem={(item) => (
                        <List.Item>
                            <Button
                                block
                                size="large"
                                onClick={() => {
                                    connect({ connector: item });
                                    setIsWalletModalOpen(false);
                                }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: 'auto', padding: '12px' }}
                            >
                                <Space>
                                    {item.icon ? <img src={item.icon} alt={item.name} style={{ width: 24, height: 24 }} /> : <WalletOutlined />}
                                    <span>{item.name}</span>
                                </Space>
                            </Button>
                        </List.Item>
                    )}
                />
            </Modal>
        </Space>
    );
}
