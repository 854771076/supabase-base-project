import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

/**
 * Verify a license key
 * GET /api/v1/licenses/verify?key=XXXX-XXXX-XXXX-XXXX
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json(
                { success: false, error: 'License key is required' },
                { status: 400 }
            );
        }

        const adminSupabase = await createAdminClient();

        // Fetch license key details
        const { data: license, error } = await adminSupabase
            .from('license_keys')
            .select(`
                id,
                status,
                expires_at,
                created_at,
                credit_products (
                    name,
                    duration_days
                )
            `)
            .eq('key_value', key)
            .single();

        if (error || !license) {
            return NextResponse.json(
                { success: false, valid: false, error: 'Invalid license key' },
                { status: 404 }
            );
        }

        // Check status
        if (license.status !== 'active') {
            return NextResponse.json(
                { success: true, valid: false, status: license.status, error: 'License is not active' },
                { status: 200 }
            );
        }

        // Check expiration
        if (license.expires_at) {
            const expiryDate = new Date(license.expires_at);
            if (expiryDate < new Date()) {
                // Auto-update status to expired if it isn't already
                await adminSupabase
                    .from('license_keys')
                    .update({ status: 'expired' })
                    .eq('id', license.id);

                return NextResponse.json(
                    { success: true, valid: false, status: 'expired', error: 'License has expired' },
                    { status: 200 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            valid: true,
            data: {
                key: key,
                product_name: (license.credit_products as any)?.name,
                expires_at: license.expires_at,
                status: license.status,
                created_at: license.created_at
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('License verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
