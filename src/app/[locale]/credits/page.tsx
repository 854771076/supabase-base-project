import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCreditProducts, getUserCredits } from '@/lib/subscription';
import CreditsStoreClient from '@/components/credits/CreditsStoreClient';

import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';

const messages = { en: enMessages, zh: zhMessages };

export default async function CreditsPage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect(`/${locale}/login`);
    }

    const products = await getCreditProducts();
    const balance = await getUserCredits();

    const m = messages[locale as keyof typeof messages] || messages.en;
    const t = m.Credits;

    return (
        <CreditsStoreClient
            products={products}
            initialBalance={balance}
            translations={t}
        />
    );
}
