'use client';

import React, { createContext, useContext, useCallback } from 'react';

import enMessages from './locale/en.json';
import zhMessages from './locale/zh.json';

type Messages = typeof enMessages;
type Locale = 'en' | 'zh';

const messages: Record<Locale, Messages> = {
    en: enMessages,
    zh: zhMessages,
};

interface I18nContextType {
    locale: Locale;
    messages: Messages;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split('.');
    let result: unknown = obj;

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = (result as Record<string, unknown>)[key];
        } else {
            return path; // Return the key if not found
        }
    }

    return typeof result === 'string' ? result : path;
}

interface I18nProviderProps {
    children: React.ReactNode;
    locale: Locale;
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
    const currentMessages = messages[locale] || messages.en;

    const t = useCallback((key: string): string => {
        return getNestedValue(currentMessages as unknown as Record<string, unknown>, key);
    }, [currentMessages]);

    return (
        <I18nContext.Provider value={{ locale, messages: currentMessages, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslations(namespace?: string) {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error('useTranslations must be used within an I18nProvider');
    }

    const t = useCallback((key: string): string => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        return context.t(fullKey);
    }, [context, namespace]);

    return t;
}

export function useLocale(): Locale {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error('useLocale must be used within an I18nProvider');
    }

    return context.locale;
}
