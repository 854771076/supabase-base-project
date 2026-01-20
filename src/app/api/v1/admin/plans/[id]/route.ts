import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const planSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    price_cents: z.number().int().min(0).optional(),
    features: z.record(z.any()).optional(),
    quotas: z.record(z.any()).optional(),
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
        const { data: plan, error } = await adminSupabase
            .from('plans')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: plan });
    } catch (error) {
        console.error('Admin Plan GET error:', error);
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
        const validatedData = planSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: plan, error } = await adminSupabase
            .from('plans')
            .update(validatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating plan:', error);
            return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: plan });
    } catch (error: any) {
        console.error('Admin Plan PUT error:', error);
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
            .from('plans')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting plan:', error);
            return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Plan deleted' });
    } catch (error) {
        console.error('Admin Plan DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
