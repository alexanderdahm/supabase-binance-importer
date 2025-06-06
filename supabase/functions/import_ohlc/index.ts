import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env = Deno.env.toObject();
const SUPABASE_URL = env.PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = env.SERVICE_ROLE_KEY!;
const START_DATE = env.START_DATE!;
const ASSET_SYMBOL = env.ASSET_SYMBOL?.toLowerCase()!;

const TABLE_NAME = `${ASSET_SYMBOL}_daily_ohlc`;
const IMPORT_TYPE = `${ASSET_SYMBOL}_daily`;

interface Candle {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const start = new Date(START_DATE);
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  let current = new Date(start);
  const BATCH_DAYS = 1000;
  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let batches = 0;

  while (current <= end) {
    const batchEnd = new Date(
      Math.min(
        current.getTime() + BATCH_DAYS * 24 * 60 * 60 * 1000,
        end.getTime()
      )
    );

    const url = `https://api.binance.com/api/v3/klines?symbol=${ASSET_SYMBOL.toUpperCase()}&interval=1d&startTime=${current.getTime()}&endTime=${batchEnd.getTime()}&limit=1000`;

    const res = await fetch(url);
    const data = (await res.json()) as unknown;

    if (!Array.isArray(data)) {
      return new Response("Error fetching data from Binance", { status: 500 });
    }

    const candles: Candle[] = data.map((c: unknown) => {
      if (!Array.isArray(c)) throw new Error("Invalid candle data");

      return {
        time: new Date(c[0] as number).toISOString(),
        open: String(c[1]),
        high: String(c[2]),
        low: String(c[3]),
        close: String(c[4]),
        volume: String(c[5]),
      };
    });

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(candles, {
        onConflict: "time",
      });

    if (error) {
      console.error(error);
      return new Response("Database insert error", { status: 500 });
    }

    totalFetched += candles.length;
    // Assume all fetched candles were inserted if no error
    totalInserted += candles.length;
    totalSkipped += 0;
    batches++;

    current = new Date(batchEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  await supabase.from("import_logs").insert({
    import_type: IMPORT_TYPE,
    start_date: START_DATE,
    end_date: end.toISOString().slice(0, 10),
    batches,
    candles_fetched: totalFetched,
    candles_inserted: totalInserted,
    candles_skipped: totalSkipped,
  });

  return new Response(
    JSON.stringify({
      status: `✅ ${ASSET_SYMBOL.toUpperCase()} candles import complete`,
      import_type: IMPORT_TYPE,
      start_date: START_DATE,
      end_date: end.toISOString().slice(0, 10),
      batches,
      candles_fetched: totalFetched,
      candles_inserted: totalInserted,
      candles_skipped: totalSkipped,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});
