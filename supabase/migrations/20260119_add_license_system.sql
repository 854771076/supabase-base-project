-- Add type and duration_days to credit_products
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
        CREATE TYPE public.product_type AS ENUM ('credits', 'license');
    END IF;
END $$;

ALTER TABLE public.credit_products 
ADD COLUMN IF NOT EXISTS type public.product_type DEFAULT 'credits' NOT NULL,
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 0 NOT NULL; -- 0 means lifetime

-- Create license_keys table
CREATE TABLE IF NOT EXISTS public.license_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.credit_products(id) ON DELETE SET NULL,
    key_value TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL, -- active, revoked, expired
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own license keys" ON public.license_keys 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service role can manage license keys" ON public.license_keys 
    FOR ALL USING (current_setting('role', true) = 'service_role');

-- Insert some license products for demonstration
INSERT INTO public.credit_products (name, credits_amount, price_cents, type, duration_days) VALUES
('Monthly Pro License', 0, 990, 'license', 30),
('Yearly Pro License', 0, 8900, 'license', 365),
('Lifetime Pro License', 0, 19900, 'license', 0);
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_type_check 
    CHECK (type IN ('subscription', 'credits', 'product','license'));
-- Update existing products to ensure they have the 'credits' type
UPDATE public.credit_products SET type = 'credits' WHERE type IS NULL;
