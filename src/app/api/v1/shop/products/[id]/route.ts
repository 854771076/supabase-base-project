import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// Schema for updating a product
const updateProductSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().optional(),
    short_description: z.string().max(500).optional(),
    price_cents: z.number().int().min(0).optional(),
    compare_at_price_cents: z.number().int().min(0).optional().nullable(),
    category_id: z.string().uuid().optional().nullable(),
    images: z.array(z.string()).optional(),
    thumbnail_url: z.string().optional().nullable(),
    stock_quantity: z.number().int().min(0).optional(),
    sku: z.string().max(100).optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    featured: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
});

// GET: Get product by ID or slug
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Try to find by UUID first, then by slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let query = supabase
            .from('products')
            .select(`
                *,
                categories(id, name, slug)
            `);

        if (isUUID) {
            query = query.eq('id', id);
        } else {
            query = query.eq('slug', id);
        }

        const { data: product, error } = await query.single();

        if (error || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Map categories to category
        const mappedProduct = {
            ...product,
            category: product.categories
        };

        return NextResponse.json({
            success: true,
            data: mappedProduct,
        });
    } catch (error) {
        console.error('Product GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update product (admin only)
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
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
        const validatedData = updateProductSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: product, error } = await adminSupabase
            .from('products')
            .update({
                ...validatedData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select(`
                *,
                category:categories(id, name, slug)
            `)
            .single();

        if (error) {
            console.error('Error updating product:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Product slug already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
        }

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: product,
        });
    } catch (error: any) {
        console.error('Product PUT error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Delete product (admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
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
        const { error } = await adminSupabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting product:', error);
            return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error('Product DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
