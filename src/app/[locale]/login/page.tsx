import LoginContent from '@/components/auth/LoginContent';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        redirect(`/${locale}`);
    }

    return <LoginContent/>;
}
