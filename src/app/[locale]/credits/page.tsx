import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCreditProducts, getUserCredits } from '@/lib/subscription';
import CreditsStoreClient from '@/components/credits/CreditsStoreClient';

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

    return (
        <CreditsStoreClient
            products={products}
            initialBalance={balance}
        />
    );
}
