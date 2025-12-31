import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';
import ProfileContent from '@/components/profile/ProfileContent';
import { setRequestLocale } from 'next-intl/server';

export default async function ProfilePage({
    params: { locale }
}: {
    params: { locale: string };
}) {
    setRequestLocale(locale);
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    const { data: { session } } = await supabase.auth.getSession();

    return <ProfileContent user={user} session={session} />;
}
