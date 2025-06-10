-- Description: Cron job to trigger the import of OHLC data from Binance into Supabase
-- This SQL script is intended to be run as a cron job in Supabase to periodically import OHLC data.

-- GoTo: Supabase Dashboard → Database → Extensions → cron → Add job
-- Note: Name: import_ohlc_job, Schedule: 0 2 * * *, Type: SQL
-- This job will run daily at 2 AM UTC

-- Ensure the cron extension is enabled in your Supabase project
select * from pg_extension where extname = 'pg_net';
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Create a cron job to call the import function
SELECT net.http_post(
  url := 'https://<your-project-ref>.functions.supabase.co/import_ohlc',
  headers := jsonb_build_object('Authorization', 'Bearer <your_anon_or_service_key>'),
  timeout_milliseconds := 5000
);