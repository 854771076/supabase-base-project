-- Function to reset usage records
-- This function can be called by pg_cron or an external automation (e.g. GitHub Actions, Vercel Cron)
CREATE OR REPLACE FUNCTION public.reset_daily_quotas()
RETURNS void AS $$
BEGIN
    -- Reset usage_count to 0 for features that should reset daily
    -- We use updated_at to track when the reset happened
    UPDATE public.usage_records
    SET usage_count = 0,
        updated_at = NOW()
    WHERE feature_name IN ('api_request'); -- Add other daily features here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To automate this in Supabase:
-- 1. Enable pg_cron: 'CREATE EXTENSION IF NOT EXISTS pg_cron;'
-- 2. Schedule the reset: 'SELECT cron.schedule('0 0 * * *', 'SELECT reset_daily_quotas();');'
-- 3. Ensure the cron runs in 'postgres' database but targets the right schema.
