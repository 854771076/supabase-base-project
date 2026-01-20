import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const planSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    price_cents: z.number().int().min(0),
    features: z.record(z.any()).optional(),
    quotas: z.record(z.any()).optional(),
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

        const adminSupabase = await createAdminClient();
        const { data: plans, error } = await adminSupabase
            .from('plans')
            .select('*')
            .order('price_cents', { ascending: true });

        if (error) {
            console.error('Error fetching plans:', error);
            return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: plans });
    } catch (error) {
        console.error('Admin Plans GET error:', error);
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
        const validatedData = planSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: plan, error } = await adminSupabase
            .from('plans')
            .insert(validatedData)
            .select()
            .single();

        if (error) {
            console.error('Error creating plan:', error);
            return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: plan }, { status: 201 });
    } catch (error: any) {
        console.error('Admin Plans POST error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
