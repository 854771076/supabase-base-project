import { NextResponse } from 'next/server';
import { getUserOrders, paymentTypeSchema } from '@/lib/payment';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const listOrdersSchema = z.object({
    type: paymentTypeSchema.optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0)
});

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const options = listOrdersSchema.parse({
            type: searchParams.get('type'),
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset')
        });

        const orders = await getUserOrders(user.id, options);

        return NextResponse.json({
            success: true,
            data: orders,
            pagination: {
                limit: options.limit,
                offset: options.offset,
                count: orders.length
            }
        });
    } catch (error: any) {
        console.error('List orders error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to list orders' }, { status: 500 });
    }
}
