import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkFeaturePermission, checkQuota, incrementUsage } from '@/lib/subscription';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Check for basic API access permission
        const hasAccess = await checkFeaturePermission('api_access');
        if (!hasAccess) {
            return NextResponse.json({
                error: 'Your current plan does not have API access. Please upgrade.'
            }, { status: 403 });
        }

        // 2. Check for daily requests quota
        const quotaCheck = await checkQuota('api_request', 'daily_requests');
        if (!quotaCheck.allowed) {
            return NextResponse.json({
                error: quotaCheck.error,
                currentUsage: quotaCheck.currentUsage,
                limit: quotaCheck.limit
            }, { status: 429 });
        }

        // 3. Increment usage
        await incrementUsage('api_request');

        return NextResponse.json({
            success: true,
            message: 'API request successful!',
            currentUsage: (quotaCheck.currentUsage || 0) + 1,
            limit: quotaCheck.limit
        });
    } catch (error: any) {
        console.error('Demo API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
