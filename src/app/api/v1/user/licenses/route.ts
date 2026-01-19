import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Get current user's license keys
 * GET /api/v1/user/licenses
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch license keys with product details
        const { data: licenses, error } = await supabase
            .from('license_keys')
            .select(`
                *,
                credit_products (
                    name
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user licenses:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch licenses' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: licenses
        }, { status: 200 });

    } catch (error: any) {
        console.error('User licenses fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
