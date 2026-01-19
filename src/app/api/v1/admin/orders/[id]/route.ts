import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

interface RouteParams {
    params: Promise<{ id: string }>;
}

const updateOrderSchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
    shipping_info: z.record(z.any()).optional(),
});

// GET: Get order by ID (Admin)
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const adminSupabase = await createAdminClient();

        const { data: order, error } = await adminSupabase
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
            `)
            .eq('id', id)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error('Admin Order GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update order status (Admin)
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = updateOrderSchema.parse(body);

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
        console.error('Admin Order PUT error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
