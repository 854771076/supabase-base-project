import LoginContent from '@/components/auth/LoginContent';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import React from 'react';

export default async function LoginPage({
    params: { locale }
}: {
    params: { locale: string };
}) {
    setRequestLocale(locale);
    const t = await getTranslations('Login');

    return <LoginContent title={t('title')} subtitle={t('subtitle')} />;
}
