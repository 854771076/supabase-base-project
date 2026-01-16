import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const addFavoriteSchema = z.object({
    product_id: z.string().uuid(),
});

// GET: List user favorites
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data: favorites, error, count } = await supabase
            .from('user_favorites')
            .select(`
                id,
                created_at,
                product:products(
                    id,
                    name,
                    slug,
                    price_cents,
                    compare_at_price_cents,
                    thumbnail_url,
                    status
                )
            `, { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching favorites:', error);
            return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: favorites,
            pagination: {
                limit,
                offset,
                total: count || 0,
            },
        });
    } catch (error) {
        console.error('Favorites GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Add product to favorites
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { product_id } = addFavoriteSchema.parse(body);

        const adminSupabase = await createAdminClient();

        // Check if product exists and is published
        const { data: product, error: productError } = await adminSupabase
            .from('products')
            .select('id, status')
            .eq('id', product_id)
            .single();

        if (productError || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const { data: favorite, error } = await adminSupabase
            .from('user_favorites')
            .insert({
                user_id: user.id,
                product_id,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Product already in favorites' }, { status: 409 });
            }
            console.error('Error adding favorite:', error);
            return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: favorite,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Favorites POST error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove product from favorites
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const product_id = searchParams.get('product_id');

        if (!product_id) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
        }

        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product_id);

        if (error) {
            console.error('Error removing favorite:', error);
            return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Favorite removed successfully',
        });
    } catch (error) {
        console.error('Favorites DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
