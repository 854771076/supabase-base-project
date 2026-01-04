import { createClient } from '@/utils/supabase/server';
import { getPlans, getUserSubscription } from '@/lib/subscription';
import PricingClient from '@/components/pricing/PricingClient';
import { redirect } from 'next/navigation';

export default async function PricingPage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect(`/${locale}/login`);
    }

    const plans = await getPlans();
    const subscription = await getUserSubscription();

    return (
        <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
            <PricingClient
                plans={plans}
                currentSubscription={subscription}
                locale={locale}
            />
        </div>
    );
}
