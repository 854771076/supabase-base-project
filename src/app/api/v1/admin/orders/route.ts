import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const updateOrderSchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
    shipping_info: z.record(z.any()).optional(),
});

// GET: List all orders (admin only)
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is super admin
        const isSuperAdmin = user.app_metadata?.is_admin === true;
        if (!isSuperAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const user_id = searchParams.get('user_id');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const adminSupabase = await createAdminClient();

        let query = adminSupabase
            .from('orders')
            .select(`
                *,
                order_items(
                    id,
                    product_name,
                    product_thumbnail,
                    quantity,
                    unit_price_cents,
                    total_price_cents
                ),
                shipping_address:shipping_addresses(*)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (type) {
            query = query.eq('type', type);
        }

        if (user_id) {
            query = query.eq('user_id', user_id);
        }

        const { data: orders, error, count } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: orders,
            pagination: {
                limit,
                offset,
                total: count || 0,
            },
        });
    } catch (error) {
        console.error('Admin orders GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update order status (admin only)
export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is super admin
        const isSuperAdmin = user.app_metadata?.is_admin === true;
        if (!isSuperAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const validatedData = updateOrderSchema.parse(updateData);

        const adminSupabase = await createAdminClient();

        const updatePayload: any = {
            ...validatedData,
            updated_at: new Date().toISOString(),
        };

        // Set completed_at if status is being set to completed
        if (validatedData.status === 'completed') {
            updatePayload.completed_at = new Date().toISOString();
        }

        const { data: order, error } = await adminSupabase
            .from('orders')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating order:', error);
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: order,
        });
    } catch (error: any) {
        console.error('Admin orders PUT error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
