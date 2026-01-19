import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { OrderDetail } from '@/components/order/OrderDetail';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const supabase = await createClient();

  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect(`/${locale}/login`);
  }

  // 查询订单详情
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !order) {
    console.error('Error fetching order:', error);
    notFound();
  }

  return <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
    <OrderDetail order={order} locale={locale} />
  </div>;
}
