create table btcusdt_daily_ohlc (
  time timestamp with time zone primary key,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  volume numeric not null
);

-- Ensure RLS is enabled
alter table btcusdt_daily_ohlc enable row level security;