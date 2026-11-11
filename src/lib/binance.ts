// Intégration Binance — Phase 1 « API Standard » (CDC 3.1.1)
// Endpoints publics, sans clé API : prix temps réel, variation 24h, chandeliers.
// Les retraits (POST /sapi/v1/capital/withdraw/apply) nécessitent une clé API et
// doivent passer par le backend (Transfer Service) — jamais depuis le navigateur.

import { ASSETS, type AssetSymbol } from "./assets";

const HOSTS = ["https://api.binance.com", "https://data-api.binance.vision"];

async function getJSON<T>(path: string): Promise<T> {
  let lastError: unknown;
  for (const host of HOSTS) {
    try {
      const res = await fetch(host + path, { cache: "no-store" });
      if (!res.ok) throw new Error(`Binance ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export interface Quote {
  usd: number;
  change24h: number;
  volumeUSD: number;
}

interface Ticker24h {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
}

export async function fetchQuotes(): Promise<Record<AssetSymbol, Quote>> {
  const pairs = ASSETS.map((a) => a.pair).filter(Boolean) as string[];
  const data = await getJSON<Ticker24h[]>(`/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`);
  const byPair = Object.fromEntries(data.map((t) => [t.symbol, t]));
  const out = {} as Record<AssetSymbol, Quote>;
  for (const a of ASSETS) {
    if (!a.pair) {
      // USDT : cotation de référence. On dérive sa variation de l'inverse USDC/USDT.
      const usdc = byPair["USDCUSDT"];
      const p = usdc ? 1 / parseFloat(usdc.lastPrice) : 1;
      out[a.symbol] = {
        usd: p,
        change24h: usdc ? -parseFloat(usdc.priceChangePercent) : 0,
        volumeUSD: usdc ? parseFloat(usdc.quoteVolume) : 0,
      };
      continue;
    }
    const t = byPair[a.pair];
    out[a.symbol] = t
      ? { usd: parseFloat(t.lastPrice), change24h: parseFloat(t.priceChangePercent), volumeUSD: parseFloat(t.quoteVolume) }
      : { usd: a.fallbackUSD, change24h: 0, volumeUSD: 0 };
  }
  return out;
}

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export type ChartRange = "1J" | "1S" | "1M" | "1A";

const RANGE_PARAMS: Record<ChartRange, { interval: string; limit: number }> = {
  "1J": { interval: "1h", limit: 24 },
  "1S": { interval: "4h", limit: 42 },
  "1M": { interval: "1d", limit: 30 },
  "1A": { interval: "1w", limit: 52 },
};

export async function fetchCandles(symbol: AssetSymbol, range: ChartRange): Promise<Candle[]> {
  const asset = ASSETS.find((a) => a.symbol === symbol)!;
  const pair = asset.pair ?? "USDCUSDT";
  const invert = !asset.pair;
  const { interval, limit } = RANGE_PARAMS[range];
  const rows = await getJSON<(string | number)[][]>(`/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`);
  return rows.map((r) => {
    const [o, h, l, c] = [r[1], r[2], r[3], r[4]].map((v) => parseFloat(String(v)));
    return invert
      ? { t: Number(r[0]), o: 1 / o, h: 1 / l, l: 1 / h, c: 1 / c }
      : { t: Number(r[0]), o, h, l, c };
  });
}
