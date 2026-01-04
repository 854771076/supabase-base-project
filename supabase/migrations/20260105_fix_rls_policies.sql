-- Add missing RLS policies for subscriptions
-- Users should be able to insert and update their own subscription record
CREATE POLICY "Users can insert own subscription" ON public.subscriptions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions 
    FOR UPDATE USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Add missing RLS policies for usage_records
-- Users should be able to insert and update their own usage record
-- This is necessary for the incrementUsage fallback and other client-side updates
CREATE POLICY "Users can insert own usage" ON public.usage_records 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.usage_records 
    FOR UPDATE USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
