import LoginContent from '@/components/auth/LoginContent';
import { getTranslations } from 'next-intl/server';
import React from 'react';

export default async function LoginPage() {
    const t = await getTranslations('Login');

    return <LoginContent title={t('title')} subtitle={t('subtitle')} />;
}
