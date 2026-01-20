import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const licenseKeySchema = z.object({
    user_id: z.string().uuid(),
    product_id: z.string().uuid().optional().nullable(),
    key_value: z.string().min(1),
    status: z.enum(['active', 'revoked', 'expired']).optional(),
    expires_at: z.string().optional().nullable(),
});

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '10') || 10, 100);
        const offset = parseInt(searchParams.get('offset') || '0') || 0;
        const search = searchParams.get('search');
        const status = searchParams.get('status');

        const adminSupabase = await createAdminClient();

        let query = adminSupabase
            .from('license_keys')
            .select(`
                *,
                user:user_id(id, email),
                product:product_id(id, name)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`key_value.ilike.%${search}%,user_id.eq.${search}`);
        }

        const { data: licenses, error, count } = await query;

        if (error) {
            console.error('Error fetching license keys:', error);
            return NextResponse.json({ error: 'Failed to fetch license keys' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: licenses,
            pagination: {
                limit,
                offset,
                total: count || 0,
            },
        });
    } catch (error) {
        console.error('Admin Licenses GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
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

        const body = await request.json();
        const validatedData = licenseKeySchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: license, error } = await adminSupabase
            .from('license_keys')
            .insert(validatedData)
            .select()
            .single();

        if (error) {
            console.error('Error creating license key:', error);
            return NextResponse.json({ error: 'Failed to create license key' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: license }, { status: 201 });
    } catch (error: any) {
        console.error('Admin Licenses POST error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
