import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

// Schema for creating a category
const createCategorySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    parent_id: z.string().uuid().optional().nullable(),
    image_url: z.string().url().optional().nullable(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
});

// GET: List all categories (Admin)
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const adminSupabase = await createAdminClient();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const is_active = searchParams.get('is_active');

        let query = adminSupabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true });

        if (search) {
            query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,id.eq.${search}`);
        }

        if (is_active !== null && is_active !== undefined) {
            query = query.eq('is_active', is_active === 'true');
        }

        const { data: categories, error } = await query;

        if (error) {
            console.error('Error fetching categories:', error);
            return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Admin Categories GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create a new category (Admin)
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = createCategorySchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: category, error } = await adminSupabase
            .from('categories')
            .insert({
                name: validatedData.name,
                slug: validatedData.slug,
                description: validatedData.description || null,
                parent_id: validatedData.parent_id || null,
                image_url: validatedData.image_url || null,
                sort_order: validatedData.sort_order || 0,
                is_active: validatedData.is_active ?? true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating category:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: category,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Admin Categories POST error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
