-- Create plans table
CREATE TABLE public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price_cents INTEGER DEFAULT 0 NOT NULL,
    features JSONB DEFAULT '{}'::jsonb NOT NULL,
    quotas JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Create usage_records table
CREATE TABLE public.usage_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    reset_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, feature_name)
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view plans" ON public.plans FOR SELECT USING (true);

CREATE POLICY "Users can view own subscription" ON public.subscriptions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON public.usage_records 
    FOR SELECT USING (auth.uid() = user_id);

-- Insert initial plans
INSERT INTO public.plans (name, description, price_cents, features, quotas) VALUES
('Free', 'Basic plan for individuals', 0, '{"api_access": true}', '{"daily_requests": 10}'),
('Pro', 'Advanced plan for professionals', 1990, '{"api_access": true, "advanced_features": true}', '{"daily_requests": 1000}');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_modtime BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_usage_records_modtime BEFORE UPDATE ON public.usage_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user and assign free plan
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    SELECT id INTO free_plan_id FROM public.plans WHERE name = 'Free' LIMIT 1;
    
    INSERT INTO public.subscriptions (user_id, plan_id)
    VALUES (new.id, free_plan_id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_subscription();

-- Atomic increment usage function
CREATE OR REPLACE FUNCTION public.increment_usage(user_id_param UUID, feature_name_param TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.usage_records (user_id, feature_name, usage_count, updated_at)
    VALUES (user_id_param, feature_name_param, 1, NOW())
    ON CONFLICT (user_id, feature_name)
    DO UPDATE SET 
        usage_count = usage_records.usage_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Existing users might need a manual backfill of subscriptions.
