import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';
import ProfileContent from '@/components/profile/ProfileContent';
import { getUserSubscription, getUserUsage, getUserCredits } from '@/lib/subscription';

export default async function ProfilePage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect(`/${locale}/login`);
    }

    const { data: { session } } = await supabase.auth.getSession();
    const subscription = await getUserSubscription();
    const usage = await getUserUsage();
    const credits = await getUserCredits();

    return (
        <ProfileContent
            user={user}
            session={session}
            subscription={subscription}
            usage={usage}
            creditsBalance={credits}
        />
    );
}
