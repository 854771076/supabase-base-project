-- Remove slug from products table — use id for routing instead
DROP INDEX IF EXISTS idx_products_slug;
ALTER TABLE public.products DROP COLUMN IF EXISTS slug;

-- Recreate products_with_price view without slug
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

GRANT SELECT ON public.products_with_price TO anon, authenticated;
