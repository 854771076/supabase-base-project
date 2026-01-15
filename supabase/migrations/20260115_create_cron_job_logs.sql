-- Create cron_job_logs table
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'started', 'success', 'failed'
    message TEXT,
    details JSONB,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name ON public.cron_job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_created_at ON public.cron_job_logs(created_at);

-- Enable RLS
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access logs (admin client)
CREATE POLICY "Admin can do everything on cron_job_logs"
ON public.cron_job_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
