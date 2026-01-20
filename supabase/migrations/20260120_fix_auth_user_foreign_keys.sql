-- Fix missing foreign keys to auth.users
-- This ensures PostgREST can resolve joins between public tables and auth.users

-- Subscriptions
ALTER TABLE IF EXISTS public.subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey,
    ADD CONSTRAINT subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User Credits
ALTER TABLE IF EXISTS public.user_credits
    DROP CONSTRAINT IF EXISTS user_credits_user_id_fkey,
    ADD CONSTRAINT user_credits_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- License Keys
ALTER TABLE IF EXISTS public.license_keys
    DROP CONSTRAINT IF EXISTS license_keys_user_id_fkey,
    ADD CONSTRAINT license_keys_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Orders
ALTER TABLE IF EXISTS public.orders
    DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
    ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Usage Records
ALTER TABLE IF EXISTS public.usage_records
    DROP CONSTRAINT IF EXISTS usage_records_user_id_fkey,
    ADD CONSTRAINT usage_records_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User Favorites
ALTER TABLE IF EXISTS public.user_favorites
    DROP CONSTRAINT IF EXISTS user_favorites_user_id_fkey,
    ADD CONSTRAINT user_favorites_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Shipping Addresses
ALTER TABLE IF EXISTS public.shipping_addresses
    DROP CONSTRAINT IF EXISTS shipping_addresses_user_id_fkey,
    ADD CONSTRAINT shipping_addresses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
