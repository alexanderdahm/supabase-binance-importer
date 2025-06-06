# 🟡 supabase-binance-importer

Import and sync historical OHLCV candlestick data from Binance into Supabase using Deno Edge Functions.

This tool fetches daily candlestick data (1d interval) for a given trading pair from the Binance API and inserts it into a dedicated Supabase table for that asset. Existing records are not duplicated, and each import run is logged.

---

## ⚙️ Features

- 🔁 Idempotent: safe to run multiple times
- 🔍 Configurable via `.env` variables
- 🗃 One Supabase table per asset (e.g. `btcusdt_daily_ohlc`)
- 🧾 Logs import metadata into a shared `import_logs` table
- 📤 Deployed as a Supabase Edge Function (Deno runtime)

---

## 📦 Requirements

- A [Supabase](https://supabase.com/) project with Edge Functions enabled
- A Binance-supported trading pair (e.g. `BTCUSDT`, `ETHUSDT`)
- Supabase CLI (`npm install -g supabase`)
- Service Role API Key from Supabase

---

## 🔧 Setup

### 1. Clone the repository

```bash
git clone https://github.com/alexanderdahm/supabase-binance-importer.git
cd supabase-binance-importer
```

### 2. Set up environment variables

Create a .env file inside the supabase/functions/import_ohlc/ folder:

```properties
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
START_DATE=2021-01-01
ASSET_SYMBOL=BTCUSDT
```

### 3. Create the Supabase tables

Run the appropriate SQL scripts for the asset and logging:

```sql
-- Example: create table for BTCUSDT
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

-- Create the import log table (shared across assets)
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
```

If you want to make the table accessible from a frontend without auth create an rls public access.

```sql
-- Ensure RLS is enabled
alter table btcusdt_daily_ohlc enable row level security;

-- Allow anyone to select rows
create policy "Public read access"
  on btcusdt_daily_ohlc
  for select
  using (true);
```

## 🚀 Deploy and Run

Set Supabase secrets

```bash
supabase secrets set \
  PUBLIC_SUPABASE_URL=https://<project_ref>.supabase.co \
  SERVICE_ROLE_KEY=your_service_role_key \
  START_DATE=2023-01-01 \
  ASSET_SYMBOL=BTCUSDT \
  --project-ref <project_ref>
```

Deploy the Edge Function

```bash
supabase functions deploy import_ohlc
```

Invoke the function manually

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://<project_ref>.functions.supabase.co/import_ohlc
```

## 📊 Example Response

```json
{
  "status": "✅ BTCUSDT candles import complete",
  "import_type": "btcusdt_daily",
  "start_date": "2021-01-01",
  "end_date": "2025-06-05",
  "batches": 8,
  "candles_fetched": 1240,
  "candles_inserted": 1240,
  "candles_skipped": 0
}
```

## 🧪 Multi-Asset Imports

To import other assets like ETHUSDT:

### 1. Create a new .env.eth file:

```properties
START_DATE=2022-01-01
ASSET_SYMBOL=ETHUSDT
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Create the required table:

```sql
create table ethusdt_daily_ohlc (
  time timestamp with time zone primary key,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  volume numeric not null
);
```

### 3. Copy .env.eth → .env and run:

```bash
cp supabase/functions/import_ohlc/.env.eth supabase/functions/import_ohlc/.env
supabase functions invoke import_ohlc --no-verify-jwt
```

## 🔁 Optional Automation Script

Example Bash loop to run multiple assets:

```bash
for asset in btc eth sol; do
  cp supabase/functions/import_ohlc/.env.$asset supabase/functions/import_ohlc/.env
  supabase functions invoke import_ohlc --no-verify-jwt
done

```

## 📄 License

MIT – feel free to fork, adapt, and improve.

## 🙌 Credits

Built with 💛 using Supabase Edge Functions and Binance API.
