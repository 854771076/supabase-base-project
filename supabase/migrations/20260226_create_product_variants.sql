-- Product Variants Migration
-- Adds multi-SKU support to the e-commerce system

-- ============================================================================
-- PRODUCT_VARIANTS TABLE
-- Stores individual SKUs/variants for each product
-- ============================================================================
CREATE TABLE public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,

    -- Variant identification
    sku TEXT UNIQUE,
    variant_name TEXT, -- e.g., "Red / Large", "Blue / Small"

    -- Pricing (can override product base price)
    price_cents INTEGER NOT NULL,
    compare_at_price_cents INTEGER,

    -- Inventory
    stock_quantity INTEGER DEFAULT 0 NOT NULL,

    -- Variant-specific attributes
    attributes JSONB DEFAULT '{}'::jsonb, -- e.g., {"color": "red", "size": "L"}

    -- Images specific to this variant
    images JSONB DEFAULT '[]'::jsonb,
    thumbnail_url TEXT,

    -- Variant status
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    weight_grams INTEGER,
    barcode TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Public can view active variants of published products
CREATE POLICY "Public can view active variants" ON public.product_variants
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variants.product_id
            AND products.status = 'published'
        )
    );

-- Service role can manage variants
CREATE POLICY "Service role can manage variants" ON public.product_variants
    FOR ALL USING (current_setting('role', true) = 'service_role');

-- Indexes
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_product_variants_active ON public.product_variants(is_active) WHERE is_active = true;

-- ============================================================================
-- VARIANT_OPTIONS TABLE
-- Stores available options for product variants (e.g., colors, sizes)
-- ============================================================================
CREATE TABLE public.variant_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,

    -- Option type (e.g., "Color", "Size", "Material")
    option_name TEXT NOT NULL,

    -- Available values (e.g., ["Red", "Blue", "Green"])
    option_values JSONB DEFAULT '[]'::jsonb NOT NULL,

    -- Display order
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(product_id, option_name)
);

-- Enable RLS
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;

-- Public can view options for published products
CREATE POLICY "Public can view variant options" ON public.variant_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = variant_options.product_id
            AND products.status = 'published'
        )
    );

-- Service role can manage options
CREATE POLICY "Service role can manage variant options" ON public.variant_options
    FOR ALL USING (current_setting('role', true) = 'service_role');

-- Indexes
CREATE INDEX idx_variant_options_product_id ON public.variant_options(product_id);

-- ============================================================================
-- UPDATE PRODUCTS TABLE
-- Add fields to support variant mode
-- ============================================================================
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS variant_type TEXT; -- 'single' or 'multiple'

-- Update existing products to single variant mode
UPDATE public.products SET has_variants = false, variant_type = 'single' WHERE has_variants IS NULL;

-- ============================================================================
-- UPDATE ORDER_ITEMS TABLE
-- Add variant reference
-- ============================================================================
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS variant_attributes JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER update_product_variants_modtime
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_variant_options_modtime
    BEFORE UPDATE ON public.variant_options
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get total stock for a product (sum of all variants)
CREATE OR REPLACE FUNCTION get_product_total_stock(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_has_variants BOOLEAN;
    v_total_stock INTEGER;
BEGIN
    SELECT has_variants INTO v_has_variants FROM public.products WHERE id = p_product_id;

    IF v_has_variants THEN
        SELECT COALESCE(SUM(stock_quantity), 0) INTO v_total_stock
        FROM public.product_variants
        WHERE product_id = p_product_id AND is_active = true;
    ELSE
        SELECT stock_quantity INTO v_total_stock
        FROM public.products
        WHERE id = p_product_id;
    END IF;

    RETURN v_total_stock;
END;
$$ LANGUAGE plpgsql;

-- Function to get price range for a product
CREATE OR REPLACE FUNCTION get_product_price_range(p_product_id UUID)
RETURNS TABLE(min_price INTEGER, max_price INTEGER) AS $$
DECLARE
    v_has_variants BOOLEAN;
BEGIN
    SELECT has_variants INTO v_has_variants FROM public.products WHERE id = p_product_id;

    IF v_has_variants THEN
        RETURN QUERY
        SELECT
            MIN(price_cents)::INTEGER,
            MAX(price_cents)::INTEGER
        FROM public.product_variants
        WHERE product_id = p_product_id AND is_active = true;
    ELSE
        RETURN QUERY
        SELECT
            price_cents::INTEGER,
            price_cents::INTEGER
        FROM public.products
        WHERE id = p_product_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.product_variants IS 'Stores individual SKUs/variants for products with multiple options';
COMMENT ON TABLE public.variant_options IS 'Defines available variant options (color, size, etc.) for products';
COMMENT ON COLUMN public.products.has_variants IS 'Whether this product has multiple variants';
COMMENT ON COLUMN public.products.variant_type IS 'Type of variant: single (no variants) or multiple (has variants)';
