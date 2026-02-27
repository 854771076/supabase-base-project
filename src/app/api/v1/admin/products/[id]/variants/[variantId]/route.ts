import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

interface RouteParams {
    params: Promise<{ id: string; variantId: string }>;
}

// Schema for updating a variant
const updateVariantSchema = z.object({
    sku: z.string().max(100).optional().nullable(),
    variant_name: z.string().max(200).optional().nullable(),
    price_cents: z.number().int().min(0).optional(),
    compare_at_price_cents: z.number().int().min(0).optional().nullable(),
    stock_quantity: z.number().int().min(0).optional(),
    attributes: z.record(z.string()).optional(),
    images: z.array(z.string()).optional(),
    thumbnail_url: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().optional(),
    weight_grams: z.number().int().optional().nullable(),
    barcode: z.string().optional().nullable(),
});

// PUT: Update a variant
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id: productId, variantId } = await params;
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
        const validatedData = updateVariantSchema.parse(body);

        const adminSupabase = await createAdminClient();
        const { data: variant, error } = await adminSupabase
            .from('product_variants')
            .update({
                ...validatedData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', variantId)
            .eq('product_id', productId)
            .select()
            .single();

        if (error) {
            console.error('Error updating variant:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Variant SKU already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
        }

        if (!variant) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: variant,
        });
    } catch (error: any) {
        console.error('Variant PUT error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Delete a variant
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id: productId, variantId } = await params;
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
        const { error } = await adminSupabase
            .from('product_variants')
            .delete()
            .eq('id', variantId)
            .eq('product_id', productId);

        if (error) {
            console.error('Error deleting variant:', error);
            return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
        }

        // Check if product still has variants
        const { data: remainingVariants } = await adminSupabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId);

        if (!remainingVariants || remainingVariants.length === 0) {
            // No more variants, revert to single product mode
            await adminSupabase
                .from('products')
                .update({ has_variants: false, variant_type: 'single' })
                .eq('id', productId);
        }

        return NextResponse.json({
            success: true,
            message: 'Variant deleted successfully',
        });
    } catch (error) {
        console.error('Variant DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
