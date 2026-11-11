import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ASSETS, type AssetSymbol } from "@/lib/assets";
import { fetchCandles, fetchQuotes, type ChartRange, type Quote } from "@/lib/binance";
import { FEES, PRICE_REFRESH_MS, PRICE_REFRESH_SAVER_MS, USD_TO_FCFA } from "@/lib/config";
import { useApp } from "@/store/AppStore";

export interface Price extends Quote {
  fcfa: number;
  /** Prix d'achat CryptoPay (spread inclus) */
  buyFCFA: number;
  /** Prix de revente CryptoPay (spread déduit) */
  sellFCFA: number;
}

export type PriceSource = "live" | "cache" | "fallback";

const CACHE_KEY = "cryptopay-niger:quotes";

function readCache(): { quotes: Record<AssetSymbol, Quote>; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fallbackQuotes(): Record<AssetSymbol, Quote> {
  return Object.fromEntries(ASSETS.map((a) => [a.symbol, { usd: a.fallbackUSD, change24h: 0, volumeUSD: 0 }])) as Record<AssetSymbol, Quote>;
}

export function useOnline() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function usePrices() {
  const { state } = useApp();
  const online = useOnline();
  const query = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const quotes = await fetchQuotes();
      const ts = Date.now();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ quotes, ts }));
      } catch {
        /* ignore */
      }
      return { quotes, ts };
    },
    refetchInterval: state.dataSaver ? PRICE_REFRESH_SAVER_MS : PRICE_REFRESH_MS,
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: online,
  });

  return useMemo(() => {
    const cache = readCache();
    let source: PriceSource = "live";
    let data = query.data;
    if (!data || query.isError) {
      if (cache) {
        data = cache;
        source = "cache";
      } else {
        data = { quotes: fallbackQuotes(), ts: 0 };
        source = "fallback";
      }
    }
    const prices = {} as Record<AssetSymbol, Price>;
    for (const a of ASSETS) {
      const q = data.quotes[a.symbol] ?? { usd: a.fallbackUSD, change24h: 0, volumeUSD: 0 };
      const fcfa = q.usd * USD_TO_FCFA;
      prices[a.symbol] = { ...q, fcfa, buyFCFA: fcfa * (1 + FEES.spread), sellFCFA: fcfa * (1 - FEES.spread) };
    }
    return { prices, source, updatedAt: data.ts, loading: query.isLoading, online, refetch: query.refetch };
  }, [query.data, query.isError, query.isLoading, query.refetch, online]);
}

export function usePortfolio() {
  const { state } = useApp();
  const { prices } = usePrices();
  return useMemo(() => {
    const rows = ASSETS.map((a) => {
      const amount = state.holdings[a.symbol] ?? 0;
      const p = prices[a.symbol];
      return { asset: a, amount, valueFCFA: amount * p.fcfa, change24h: p.change24h };
    }).filter((r) => r.amount > 0);
    const totalFCFA = rows.reduce((s, r) => s + r.valueFCFA, 0);
    // Variation pondérée par la valeur détenue
    const change24h = totalFCFA > 0 ? rows.reduce((s, r) => s + (r.change24h * r.valueFCFA) / totalFCFA, 0) : 0;
    return { rows, totalFCFA, change24h };
  }, [state.holdings, prices]);
}

export function useCandles(symbol: AssetSymbol, range: ChartRange, enabled = true) {
  const { state } = useApp();
  return useQuery({
    queryKey: ["candles", symbol, range],
    queryFn: () => fetchCandles(symbol, range),
    enabled: enabled && !state.dataSaver,
    staleTime: range === "1J" ? 60_000 : 5 * 60_000,
    retry: 1,
  });
}
