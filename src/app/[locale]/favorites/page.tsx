import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import FavoritesClient from '@/components/favorites/FavoritesClient';

export default async function FavoritesPage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect(`/${locale}/login`);
    }

    return <FavoritesClient />;
}