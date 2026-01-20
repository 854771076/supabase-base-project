import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const licenseKeySchema = z.object({
    status: z.enum(['active', 'revoked', 'expired']).optional(),
    expires_at: z.string().optional().nullable(),
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
        const { data: license, error } = await adminSupabase
            .from('license_keys')
            .select(`
                *,
                user:user_id(id, email),
                product:product_id(id, name)
            `)
            .eq('id', id)
            .single();

        if (error || !license) {
            return NextResponse.json({ error: 'License key not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: license });
    } catch (error) {
        console.error('Admin License GET error:', error);
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
        const validatedData = licenseKeySchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: license, error } = await adminSupabase
            .from('license_keys')
            .update(validatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating license key:', error);
            return NextResponse.json({ error: 'Failed to update license key' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: license });
    } catch (error: any) {
        console.error('Admin License PUT error:', error);
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
            .from('license_keys')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting license key:', error);
            return NextResponse.json({ error: 'Failed to delete license key' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'License key deleted' });
    } catch (error) {
        console.error('Admin License DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
