import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
    plan_id: z.string().uuid().optional(),
    status: z.enum(['active', 'cancelled', 'expired', 'past_due']).optional(),
    current_period_end: z.string().optional().nullable(),
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
        const { data: subscription, error } = await adminSupabase
            .from('subscriptions')
            .select(`
                *,
                plans(id, name),
                user:user_id(id, email)
            `)
            .eq('id', id)
            .single();

        if (error || !subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: subscription });
    } catch (error) {
        console.error('Admin Subscription GET error:', error);
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
        const validatedData = subscriptionSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: subscription, error } = await adminSupabase
            .from('subscriptions')
            .update(validatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating subscription:', error);
            return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: subscription });
    } catch (error: any) {
        console.error('Admin Subscription PUT error:', error);
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
            .from('subscriptions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting subscription:', error);
            return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Subscription deleted' });
    } catch (error) {
        console.error('Admin Subscription DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
