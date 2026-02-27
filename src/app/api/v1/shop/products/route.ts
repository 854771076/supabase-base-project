import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET: List published products — uses products_with_price view (min price from variants)
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const category_id = searchParams.get('category_id');
        const featured = searchParams.get('featured');
        const search = searchParams.get('search');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabase
            .from('products_with_price')
            .select(`
                id, name, thumbnail_url, featured, has_variants,
                min_price_cents, max_price_cents, min_compare_at_price_cents,
                total_stock_quantity, variant_count,
                categories(id, name, slug)
            `, { count: 'exact' })
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category_id) query = query.eq('category_id', category_id);
        if (featured === 'true') query = query.eq('featured', true);
        if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

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
        console.error('Products GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

