create table ethusdt_daily_ohlc (
  time timestamp with time zone primary key,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  volume numeric not null
);

-- Ensure RLS is enabled
alter table ethusdt_daily_ohlc enable row level security;

-- Create a policy allowing anon users to SELECT all rows (for public access via frontend)
CREATE POLICY "Allow anon SELECT"
ON ethusdt_daily_ohlc
FOR SELECT
TO anon
USING (true);