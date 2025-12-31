'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { Locale } from '@/i18n/config';

const StyledComponentsRegistry = ({ children, locale }: { children: React.ReactNode; locale: Locale }) => {
    return (
        <AntdRegistry>
            <ConfigProvider
                locale={locale === 'zh' ? zhCN : enUS}
                theme={{
                    cssVar: true,
                    hashed: false,
                }}
            >
                <App>{children}</App>
            </ConfigProvider>
        </AntdRegistry>
    );
};

export default StyledComponentsRegistry;
