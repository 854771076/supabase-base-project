-- 1. Enable pg_cron extension (required for scheduling)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Function to reset daily quotas
CREATE OR REPLACE FUNCTION public.reset_daily_quotas()
RETURNS void AS $$
BEGIN
    -- Reset usage_count for daily features
    UPDATE public.usage_records
    SET usage_count = 0,
        updated_at = NOW()
    WHERE feature_name IN ('api_request', 'daily_limit_feature'); -- Add your daily features here
    
    RAISE NOTICE 'Daily quotas reset at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to reset monthly quotas
CREATE OR REPLACE FUNCTION public.reset_monthly_quotas()
RETURNS void AS $$
BEGIN
    -- Reset usage_count for monthly features
    UPDATE public.usage_records
    SET usage_count = 0,
        updated_at = NOW()
    WHERE feature_name LIKE '%_monthly'; -- Convention: features ending in _monthly
    
    RAISE NOTICE 'Monthly quotas reset at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Schedule the tasks using pg_cron
-- Note: '0 0 * * *' means every day at midnight (UTC)
-- Note: '0 0 1 * *' means the 1st day of every month at midnight (UTC)

-- Schedule Daily Reset
SELECT cron.schedule(
    'daily-quota-reset', -- unique identifier for the job
    '0 0 * * *',         -- every day at 00:00
    'SELECT public.reset_daily_quotas();'
);

-- Schedule Monthly Reset
SELECT cron.schedule(
    'monthly-quota-reset', -- unique identifier for the job
    '0 0 1 * *',           -- 1st of every month at 00:00
    'SELECT public.reset_monthly_quotas();'
);

-- Note for the user:
-- You can view your scheduled jobs by running: 'SELECT * FROM cron.job;'
-- You can view the status of recent runs by running: 'SELECT * FROM cron.job_run_details;'
