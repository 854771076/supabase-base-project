-- E-commerce Schema Migration
-- Creates tables for product catalog, favorites, shipping addresses, and order items

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can view active categories
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

-- Service role can manage categories
CREATE POLICY "Service role can manage categories" ON public.categories
    USING (current_setting('role', true) = 'service_role');

-- Indexes
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    compare_at_price_cents INTEGER,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    images JSONB DEFAULT '[]'::jsonb,
    thumbnail_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    sku TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can view published products
CREATE POLICY "Public can view published products" ON public.products
    FOR SELECT USING (status = 'published');

-- Service role can manage products
CREATE POLICY "Service role can manage products" ON public.products
    FOR ALL USING (current_setting('role', true) = 'service_role');

-- Indexes
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_featured ON public.products(featured) WHERE featured = true;

-- ============================================================================
-- USER FAVORITES TABLE
-- ============================================================================
CREATE TABLE public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view own favorites
CREATE POLICY "Users can view own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

-- Users can manage own favorites
CREATE POLICY "Users can manage own favorites" ON public.user_favorites
    FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_product_id ON public.user_favorites(product_id);

-- ============================================================================
-- SHIPPING ADDRESSES TABLE
-- ============================================================================
CREATE TABLE public.shipping_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'CN',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Users can view own addresses
CREATE POLICY "Users can view own addresses" ON public.shipping_addresses
    FOR SELECT USING (auth.uid() = user_id);

-- Users can manage own addresses
CREATE POLICY "Users can manage own addresses" ON public.shipping_addresses
    FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_shipping_addresses_user_id ON public.shipping_addresses(user_id);

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_thumbnail TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can view own order items via order ownership
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Service role can manage order items
CREATE POLICY "Service role can manage order items" ON public.order_items
    FOR ALL USING (current_setting('role', true) = 'service_role');
CREATE POLICY "Service role can manage order shipping_addresses" ON public.shipping_addresses
    FOR ALL USING (current_setting('role', true) = 'service_role');
-- Indexes
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- ============================================================================
-- EXTEND ORDERS TABLE
-- ============================================================================
-- Add shipping address reference and product order type
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES public.shipping_addresses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT '{}'::jsonb;

-- Update check constraint to include 'product' type
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_type_check 
    CHECK (type IN ('subscription', 'credits', 'product'));

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER update_categories_modtime
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_shipping_addresses_modtime
    BEFORE UPDATE ON public.shipping_addresses
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional sample categories)
-- ============================================================================
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
    ('Electronics', 'electronics', 'Electronic devices and accessories', 1),
    ('Clothing', 'clothing', 'Fashion and apparel', 2),
    ('Home & Garden', 'home-garden', 'Home decor and gardening supplies', 3),
    ('Books', 'books', 'Books and publications', 4);
