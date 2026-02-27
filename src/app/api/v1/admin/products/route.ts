import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

// sku, images, compare_at_price_cents, stock_quantity, price_cents removed —
// those fields now live on product_variants
const productSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    short_description: z.string().max(500).optional(),
    category_id: z.string().uuid().optional().nullable(),
    thumbnail_url: z.string().optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    featured: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
});

// GET: List products (Admin) — uses products_with_price view for min price & stock
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.app_metadata?.is_admin !== true) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const category_id = searchParams.get('category_id');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const adminSupabase = await createAdminClient();

        let query = adminSupabase
            .from('products_with_price')
            .select(`
                id, name, description, short_description,
                thumbnail_url, status, featured, has_variants, metadata,
                created_at, updated_at,
                min_price_cents, max_price_cents, min_compare_at_price_cents,
                total_stock_quantity, variant_count,
                categories(id, name, slug)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);
        if (category_id) query = query.eq('category_id', category_id);
        if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,id.eq.${search}`);

        const { data: products, error, count } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }

        const mappedProducts = products?.map((p: any) => ({
            ...p,
            category: p.categories,
        }));

        return NextResponse.json({
            success: true,
            data: mappedProducts,
            pagination: { limit, offset, total: count || 0 },
        });
    } catch (error) {
        console.error('Admin Products GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create product (Admin)
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.app_metadata?.is_admin !== true) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = productSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: product, error } = await adminSupabase
            .from('products')
            .insert({
                name: validatedData.name,
                description: validatedData.description || null,
                short_description: validatedData.short_description || null,
                category_id: validatedData.category_id || null,
                thumbnail_url: validatedData.thumbnail_url || null,
                status: validatedData.status || 'draft',
                featured: validatedData.featured || false,
                metadata: validatedData.metadata || {},
                has_variants: true,
                variant_type: 'multiple',
            })
            .select('*, categories(id, name, slug)')
            .single();

        if (error) {
            console.error('Error creating product:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Product already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: { ...product, category: product.categories },
        }, { status: 201 });
    } catch (error: any) {
        console.error('Admin Products POST error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


