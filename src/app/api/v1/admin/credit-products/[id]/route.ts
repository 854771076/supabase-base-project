import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const creditProductSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    credits_amount: z.number().int().min(0).optional(),
    price_cents: z.number().int().min(0).optional(),
    type: z.enum(['credits', 'license']).optional(),
    duration_days: z.number().int().min(0).optional(),
});

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const adminSupabase = await createAdminClient();
        const { data: product, error } = await adminSupabase
            .from('credit_products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error('Admin Credit Product GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = creditProductSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: product, error } = await adminSupabase
            .from('credit_products')
            .update(validatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating credit product:', error);
            return NextResponse.json({ error: 'Failed to update credit product' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: product });
    } catch (error: any) {
        console.error('Admin Credit Product PUT error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('credit_products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting credit product:', error);
            return NextResponse.json({ error: 'Failed to delete credit product' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        console.error('Admin Credit Product DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
