import LoginContent from '@/components/auth/LoginContent';

import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';

const messages = { en: enMessages, zh: zhMessages };

export default async function LoginPage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const m = messages[locale as keyof typeof messages] || messages.en;
    const t = m.Login;

    return <LoginContent title={t.title} subtitle={t.subtitle} />;
}
