-- Remove redundant columns from products table
-- These fields are now owned by product_variants table

-- Drop redundant columns
ALTER TABLE public.products
    DROP COLUMN IF EXISTS sku,
    DROP COLUMN IF EXISTS images,
    DROP COLUMN IF EXISTS compare_at_price_cents,
    DROP COLUMN IF EXISTS stock_quantity,
    DROP COLUMN IF EXISTS price_cents;

-- Drop old indexes that referenced these columns
DROP INDEX IF EXISTS idx_products_slug;

-- Note: slug is kept as the URL identifier for products
-- Re-add slug index (slug is still needed for routing)
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Add a helper view that computes min/max price from variants
CREATE OR REPLACE VIEW public.products_with_price AS
SELECT
    p.*,
    MIN(v.price_cents)                          AS min_price_cents,
    MAX(v.price_cents)                          AS max_price_cents,
    MIN(v.compare_at_price_cents)               AS min_compare_at_price_cents,
    COALESCE(SUM(v.stock_quantity), 0)::INTEGER AS total_stock_quantity,
    COUNT(v.id)::INTEGER                        AS variant_count
FROM public.products p
LEFT JOIN public.product_variants v
    ON v.product_id = p.id AND v.is_active = true
GROUP BY p.id;

-- Grant access
GRANT SELECT ON public.products_with_price TO anon, authenticated;
