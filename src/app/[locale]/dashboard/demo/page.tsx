import React from 'react';
import { getUserSubscription, getUserUsage } from '@/lib/subscription';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DemoClient from '@/components/demo/DemoClient';

export default async function DemoPage({ params }: { params: { locale: string } }) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/login`);
    }

    const subscription = await getUserSubscription();
    const usage = await getUserUsage();

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f7fa', padding: '40px 0' }}>
            <DemoClient
                subscription={subscription}
                initialUsage={usage}
            />
        </div>
    );
}
