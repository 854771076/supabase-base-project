import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

// Schema for creating/updating a product
const productSchema = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    short_description: z.string().max(500).optional(),
    price_cents: z.number().int().min(0),
    compare_at_price_cents: z.number().int().min(0).optional().nullable(),
    category_id: z.string().uuid().optional().nullable(),
    images: z.array(z.string().url()).optional(),
    thumbnail_url: z.string().url().optional().nullable(),
    stock_quantity: z.number().int().min(0).optional(),
    sku: z.string().max(100).optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    featured: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
});

// GET: List products with filters (Admin)
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

        const { searchParams } = new URL(request.url);
        const category_id = searchParams.get('category_id');
        const status = searchParams.get('status');
        const featured = searchParams.get('featured');
        const search = searchParams.get('search');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const adminSupabase = await createAdminClient();

        let query = adminSupabase
            .from('products')
            .select(`
                *,
                categories(id, name, slug)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (category_id) {
            query = query.eq('category_id', category_id);
        }

        if (featured === 'true') {
            query = query.eq('featured', true);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: products, error, count } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }

        // Map categories to category for frontend compatibility
        const mappedProducts = products?.map((p: any) => ({
            ...p,
            category: p.categories
        }));

        return NextResponse.json({
            success: true,
            data: mappedProducts,
            pagination: {
                limit,
                offset,
                total: count || 0,
            },
        });
    } catch (error) {
        console.error('Admin Products GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create a new product (Admin)
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
        const validatedData = productSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: product, error } = await adminSupabase
            .from('products')
            .insert({
                name: validatedData.name,
                slug: validatedData.slug,
                description: validatedData.description || null,
                short_description: validatedData.short_description || null,
                price_cents: validatedData.price_cents,
                compare_at_price_cents: validatedData.compare_at_price_cents || null,
                category_id: validatedData.category_id || null,
                images: validatedData.images || [],
                thumbnail_url: validatedData.thumbnail_url || null,
                stock_quantity: validatedData.stock_quantity || 0,
                sku: validatedData.sku || null,
                status: validatedData.status || 'draft',
                featured: validatedData.featured || false,
                metadata: validatedData.metadata || {},
            })
            .select(`
                *,
                categories(id, name, slug)
            `)
            .single();

        if (error) {
            console.error('Error creating product:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Product slug already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
        }

        // Map categories to category
        const mappedProduct = {
            ...product,
            category: product.categories
        };

        return NextResponse.json({
            success: true,
            data: mappedProduct,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Admin Products POST error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
