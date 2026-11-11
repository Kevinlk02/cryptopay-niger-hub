import { ASSET_MAP, type AssetSymbol } from "./assets";
import { EUR_TO_FCFA, USD_TO_FCFA } from "./config";

export type Currency = "FCFA" | "USD" | "EUR";

const clean = (s: string) => s.replace(/[\u202f\u00a0]/g, "\u00a0");

export function formatNumber(n: number, maxDecimals = 0): string {
  return clean(n.toLocaleString("fr-FR", { maximumFractionDigits: maxDecimals }));
}

export function formatCrypto(amount: number, symbol: AssetSymbol): string {
  const d = ASSET_MAP[symbol]?.decimals ?? 6;
  return `${clean(amount.toLocaleString("fr-FR", { maximumFractionDigits: d }))}\u00a0${symbol}`;
}

/** Convertit un montant FCFA vers la devise d'affichage choisie dans le profil. */
export function fromFCFA(fcfa: number, currency: Currency): number {
  if (currency === "USD") return fcfa / USD_TO_FCFA;
  if (currency === "EUR") return fcfa / EUR_TO_FCFA;
  return fcfa;
}

export function formatMoney(fcfa: number, currency: Currency = "FCFA"): string {
  const v = fromFCFA(fcfa, currency);
  if (currency === "USD") return clean(v.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }));
  if (currency === "EUR") return clean(v.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }));
  return `${formatNumber(Math.round(v))}\u00a0FCFA`;
}

/** Montant seul (sans devise) pour les grands affichages. */
export function formatMoneyValue(fcfa: number, currency: Currency = "FCFA"): string {
  const v = fromFCFA(fcfa, currency);
  return currency === "FCFA" ? formatNumber(Math.round(v)) : formatNumber(v, 2);
}

export function formatCompactUSD(v: number): string {
  if (v >= 1e9) return `$${formatNumber(v / 1e9, 1)}\u00a0Md`;
  if (v >= 1e6) return `$${formatNumber(v / 1e6, 1)}\u00a0M`;
  if (v >= 1e3) return `$${formatNumber(v / 1e3, 1)}\u00a0k`;
  return `$${formatNumber(v, 0)}`;
}

export function formatUSD(v: number): string {
  const digits = v >= 100 ? 2 : v >= 1 ? 4 : 6;
  return "$" + clean(v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: digits }));
}

export function formatPercent(p: number): string {
  return `${p >= 0 ? "+" : ""}${formatNumber(p, 2)}\u00a0%`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const hm = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, now)) return `Aujourd'hui ${hm}`;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return `Hier ${hm}`;
  return d.toLocaleDateString("fr-FR");
}

export function shortAddress(a: string): string {
  return a.length > 20 ? `${a.slice(0, 10)}…${a.slice(-6)}` : a;
}
