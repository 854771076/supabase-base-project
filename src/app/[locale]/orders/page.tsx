import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';
import { getUserOrders } from '@/lib/payment';
import OrderHistory from '@/components/order/OrderHistory';

export default async function OrdersPage(props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ type?: string }>;
}) {
    const { locale } = await props.params;
    const searchParams = await props.searchParams;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect(`/${locale}/login`);
    }

    const typeParam = searchParams.type;
    const type = (typeParam === 'subscription' || typeParam === 'credits') ? typeParam : 'all';
    const orders = await getUserOrders(user.id, {
        type: type === 'all' ? undefined : type,
        limit: 100,
        offset: 0
    });

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width:"100%" }}>
            <OrderHistory orders={orders} />
        </div>
    );
}