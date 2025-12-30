'use client';

import React from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type Entity from '@ant-design/cssinjs/es/Cache';
import { useServerInsertedHTML } from 'next/navigation';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { Locale } from '@/i18n/config';

const StyledComponentsRegistry = ({ children, locale }: { children: React.ReactNode; locale: Locale }) => {
    const cache = React.useMemo<Entity>(() => createCache(), []);
    useServerInsertedHTML(() => (
        <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
    ));
    return (
        <StyleProvider cache={cache}>
            <ConfigProvider locale={locale === 'zh' ? zhCN : enUS}>
                {children}
            </ConfigProvider>
        </StyleProvider>
    );
};

export default StyledComponentsRegistry;
