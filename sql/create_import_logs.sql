create table import_logs (
  id uuid primary key default gen_random_uuid(),
  import_type text not null,
  start_date date not null,
  end_date date not null,
  batches int not null,
  candles_fetched int not null,
  candles_inserted int not null,
  candles_skipped int not null,
  created_at timestamp with time zone default now()
);

-- Ensure RLS is enabled
alter table import_logs enable row level security;
