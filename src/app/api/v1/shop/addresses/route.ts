import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const addressSchema = z.object({
    full_name: z.string().min(1).max(100),
    phone: z.string().max(20).optional(),
    address_line1: z.string().min(1).max(200),
    address_line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    postal_code: z.string().min(1).max(20),
    country: z.string().min(2).max(2).default('CN'),
    is_default: z.boolean().optional(),
});

// GET: List user shipping addresses
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: addresses, error } = await supabase
            .from('shipping_addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching addresses:', error);
            return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: addresses,
        });
    } catch (error) {
        console.error('Addresses GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create or update shipping address
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const id = body.id; // Optional: if provided, update existing
        const validatedData = addressSchema.parse(body);

        const adminSupabase = await createAdminClient();

        // If setting as default, unset other defaults first
        if (validatedData.is_default) {
            await adminSupabase
                .from('shipping_addresses')
                .update({ is_default: false })
                .eq('user_id', user.id);
        }

        let result;

        if (id) {
            // Update existing address
            const { data, error } = await adminSupabase
                .from('shipping_addresses')
                .update({
                    ...validatedData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .eq('user_id', user.id) // Ensure user owns this address
                .select()
                .single();

            if (error) {
                console.error('Error updating address:', error);
                return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
            }

            if (!data) {
                return NextResponse.json({ error: 'Address not found' }, { status: 404 });
            }

            result = data;
        } else {
            // Create new address
            const { data, error } = await adminSupabase
                .from('shipping_addresses')
                .insert({
                    user_id: user.id,
                    ...validatedData,
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating address:', error);
                return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
            }

            result = data;
        }

        return NextResponse.json({
            success: true,
            data: result,
        }, { status: id ? 200 : 201 });
    } catch (error: any) {
        console.error('Addresses POST error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove shipping address
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('shipping_addresses')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting address:', error);
            return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Address deleted successfully',
        });
    } catch (error) {
        console.error('Addresses DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
