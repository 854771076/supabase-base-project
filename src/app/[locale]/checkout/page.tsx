import CheckoutClient from '@/components/payment/CheckoutClient';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
export default async function CheckoutPage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect(`/${locale}/login`);
    }
    return <CheckoutClient />;
}
