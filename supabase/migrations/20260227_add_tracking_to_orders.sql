-- Add shipping tracking fields to orders table
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS tracking_number TEXT,
    ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;
