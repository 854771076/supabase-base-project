-- Fix Products Table Columns
-- Ensures all necessary columns for multi-image support and enhanced product details exist

ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS compare_at_price_cents INTEGER,
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Ensure indexes exist for new columns
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
