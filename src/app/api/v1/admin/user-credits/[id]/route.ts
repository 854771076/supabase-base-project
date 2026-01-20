import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const userCreditsSchema = z.object({
    balance: z.number().int().min(0),
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
        const { data: credits, error } = await adminSupabase
            .from('user_credits')
            .select(`
                *,
                user:user_id(id, email)
            `)
            .eq('id', id)
            .single();

        if (error || !credits) {
            return NextResponse.json({ error: 'User credits not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: credits });
    } catch (error) {
        console.error('Admin User Credits GET error:', error);
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
        const validatedData = userCreditsSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: credits, error } = await adminSupabase
            .from('user_credits')
            .update(validatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating user credits:', error);
            return NextResponse.json({ error: 'Failed to update user credits' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: credits });
    } catch (error: any) {
        console.error('Admin User Credits PUT error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
