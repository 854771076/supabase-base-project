import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get product by ID or slug — async-parallel: fetch variants & options simultaneously
export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let query = supabase
            .from('products')
            .select('*, categories(id, name, slug)');

        query = isUUID ? query.eq('id', id) : query.eq('slug', id);

        const { data: product, error } = await query.single();

        if (error || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // async-parallel: fetch variants and options at the same time
        const [variantsResult, optionsResult] = await Promise.all([
            supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', product.id)
                .eq('is_active', true)
                .order('sort_order', { ascending: true }),
            supabase
                .from('variant_options')
                .select('*')
                .eq('product_id', product.id)
                .order('sort_order', { ascending: true }),
        ]);

        // If no variant_options rows exist, derive them from variant attributes
        let variantOptions = optionsResult.data || [];
        if (variantOptions.length === 0 && variantsResult.data && variantsResult.data.length > 0) {
            const optionMap: Record<string, Set<string>> = {};
            for (const variant of variantsResult.data) {
                for (const [key, value] of Object.entries(variant.attributes || {})) {
                    if (!optionMap[key]) optionMap[key] = new Set();
                    optionMap[key].add(String(value));
                }
            }
            variantOptions = Object.entries(optionMap).map(([name, values], i) => ({
                id: `derived-${i}`,
                product_id: product.id,
                option_name: name,
                option_values: Array.from(values),
                sort_order: i,
            }));
        }

        return NextResponse.json({
            success: true,
            data: {
                ...product,
                category: product.categories,
                variants: variantsResult.data || [],
                variant_options: variantOptions,
            },
        });
    } catch (error) {
        console.error('Product GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
