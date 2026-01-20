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
        const limit = Math.min(parseInt(searchParams.get('limit') || '50') || 50, 200);
        const offset = parseInt(searchParams.get('offset') || '0') || 0;
        const job_name = searchParams.get('job_name');
        const status = searchParams.get('status');

        const adminSupabase = await createAdminClient();

        let query = adminSupabase
            .from('cron_job_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (job_name) {
            query = query.eq('job_name', job_name);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data: logs, error, count } = await query;

        if (error) {
            console.error('Error fetching logs:', error);
            return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: logs,
            pagination: {
                limit,
                offset,
                total: count || 0,
            },
        });
    } catch (error) {
        console.error('Admin Logs GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
