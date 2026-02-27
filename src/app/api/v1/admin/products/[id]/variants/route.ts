import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// Schema for creating/updating a variant
const variantSchema = z.object({
    sku: z.string().max(100).optional().nullable(),
    variant_name: z.string().max(200).optional().nullable(),
    price_cents: z.number().int().min(0),
    compare_at_price_cents: z.number().int().min(0).optional().nullable(),
    stock_quantity: z.number().int().min(0),
    attributes: z.record(z.string()).optional(),
    images: z.array(z.string()).optional(),
    thumbnail_url: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().optional(),
    weight_grams: z.number().int().optional().nullable(),
    barcode: z.string().optional().nullable(),
});

// GET: List all variants for a product
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: productId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const adminSupabase = await createAdminClient();
        const { data: variants, error } = await adminSupabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching variants:', error);
            return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: variants || [],
        });
    } catch (error) {
        console.error('Variants GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create a new variant
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: productId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = user.app_metadata?.is_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = variantSchema.parse(body);

        const adminSupabase = await createAdminClient();

        // Check if product exists
        const { data: product } = await adminSupabase
            .from('products')
            .select('id')
            .eq('id', productId)
            .single();

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Create variant
        const { data: variant, error } = await adminSupabase
            .from('product_variants')
            .insert({
                product_id: productId,
                sku: validatedData.sku || null,
                variant_name: validatedData.variant_name || null,
                price_cents: validatedData.price_cents,
                compare_at_price_cents: validatedData.compare_at_price_cents || null,
                stock_quantity: validatedData.stock_quantity,
                attributes: validatedData.attributes || {},
                images: validatedData.images || [],
                thumbnail_url: validatedData.thumbnail_url || null,
                is_active: validatedData.is_active ?? true,
                sort_order: validatedData.sort_order || 0,
                weight_grams: validatedData.weight_grams || null,
                barcode: validatedData.barcode || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating variant:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Variant SKU already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
        }

        // Update product to enable variants
        await adminSupabase
            .from('products')
            .update({ has_variants: true, variant_type: 'multiple' })
            .eq('id', productId);

        return NextResponse.json({
            success: true,
            data: variant,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Variant POST error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
