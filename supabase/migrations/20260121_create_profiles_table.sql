-- Create profiles table to store user information
-- This table mirrors auth.users and allows PostgREST to resolve foreign key joins

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can view all profiles" ON public.profiles
    FOR SELECT USING (current_setting('role', true) = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();

-- Function to handle user profile updates
CREATE OR REPLACE FUNCTION public.handle_user_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        email = NEW.email,
        full_name = NEW.raw_user_meta_data->>'full_name',
        avatar_url = NEW.raw_user_meta_data->>'avatar_url',
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user updates
CREATE TRIGGER on_auth_user_updated_profile
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_user_profile_update();

-- Backfill existing users
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Add foreign key constraints from other tables to profiles
-- Subscriptions
ALTER TABLE IF EXISTS public.subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- User Credits
ALTER TABLE IF EXISTS public.user_credits
    DROP CONSTRAINT IF EXISTS user_credits_user_id_fkey;
ALTER TABLE IF EXISTS public.user_credits
    ADD CONSTRAINT user_credits_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- License Keys
ALTER TABLE IF EXISTS public.license_keys
    DROP CONSTRAINT IF EXISTS license_keys_user_id_fkey;
ALTER TABLE IF EXISTS public.license_keys
    ADD CONSTRAINT license_keys_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Orders
ALTER TABLE IF EXISTS public.orders
    DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE IF EXISTS public.orders
    ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Usage Records
ALTER TABLE IF EXISTS public.usage_records
    DROP CONSTRAINT IF EXISTS usage_records_user_id_fkey;
ALTER TABLE IF EXISTS public.usage_records
    ADD CONSTRAINT usage_records_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- User Favorites
ALTER TABLE IF EXISTS public.user_favorites
    DROP CONSTRAINT IF EXISTS user_favorites_user_id_fkey;
ALTER TABLE IF EXISTS public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Shipping Addresses
ALTER TABLE IF EXISTS public.shipping_addresses
    DROP CONSTRAINT IF EXISTS shipping_addresses_user_id_fkey;
ALTER TABLE IF EXISTS public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
