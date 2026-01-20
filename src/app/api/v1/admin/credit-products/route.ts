import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const creditProductSchema = z.object({
    name: z.string().min(1).max(100),
    credits_amount: z.number().int().min(0),
    price_cents: z.number().int().min(0),
    type: z.enum(['credits', 'license']).optional(),
    duration_days: z.number().int().min(0).optional(),
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
        const { data: products, error } = await adminSupabase
            .from('credit_products')
            .select('*')
            .order('price_cents', { ascending: true });

        if (error) {
            console.error('Error fetching credit products:', error);
            return NextResponse.json({ error: 'Failed to fetch credit products' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: products });
    } catch (error) {
        console.error('Admin Credit Products GET error:', error);
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
        const validatedData = creditProductSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: product, error } = await adminSupabase
            .from('credit_products')
            .insert(validatedData)
            .select()
            .single();

        if (error) {
            console.error('Error creating credit product:', error);
            return NextResponse.json({ error: 'Failed to create credit product' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: product }, { status: 201 });
    } catch (error: any) {
        console.error('Admin Credit Products POST error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
