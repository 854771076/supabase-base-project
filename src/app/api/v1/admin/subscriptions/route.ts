import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';

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

        const adminSupabase = await createAdminClient();

        let query = adminSupabase
            .from('subscriptions')
            .select(`
                *,
                plans(id, name),
                user:user_id(id, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            // Search by user email if possible, or user_id
            // Note: Searching across joins in Supabase can be tricky depending on schema
            query = query.or(`user_id.eq.${search}`);
        }

        const { data: subscriptions, error, count } = await query;

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: subscriptions,
            pagination: {
                limit,
                offset,
                total: count || 0,
            },
        });
    } catch (error) {
        console.error('Admin Subscriptions GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
