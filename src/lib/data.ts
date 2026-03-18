export const MOCK_USER = {
  name: "Moussa Salifou",
  initials: "MS",
  phone: "+227 90 00 00 00",
  kycLevel: 1,
};

export const RATES: Record<string, number> = {
  BTC: 36_500_000,
  ETH: 1_450_000,
  USDT: 600,
  USDC: 600,
  BNB: 240_000,
  SOL: 87_500,
};

export const PORTFOLIO = {
  totalFCFA: 245_800,
  change: "+2.4%",
  assets: [
    { symbol: "BTC", name: "Bitcoin", network: "BTC NETWORK", color: "#F7931A", amount: 0.0058, valueFCFA: 398_400 },
    { symbol: "ETH", name: "Ethereum", network: "ETH NETWORK", color: "#627EEA", amount: 0.032, valueFCFA: 41_900 },
    { symbol: "USDT", name: "Tether", network: "TRC-20", color: "#26A17B", amount: 0.0, valueFCFA: 0 },
  ],
};

export const MARKET = [
  { symbol: "BTC", name: "Bitcoin", color: "#F7931A", priceFCFA: 36_500_200, priceUSD: 64_231.5, vol: "$32,18", change: +0.42 },
  { symbol: "ETH", name: "Ethereum", color: "#627EEA", priceFCFA: 1_450_100, priceUSD: 3_452.12, vol: "$16,49", change: -0.32 },
  { symbol: "SOL", name: "Solana", color: "#9945FF", priceFCFA: 87_500, priceUSD: 145.67, vol: "$4.22", change: +0.5 },
  { symbol: "USDT", name: "Tether", color: "#26A17B", priceFCFA: 600, priceUSD: 1.0, vol: "$312,53", change: -0.06 },
  { symbol: "BNB", name: "BNB", color: "#F3BA2F", priceFCFA: 240_000, priceUSD: 410.2, vol: "$8,91", change: -1.2 },
];

export const TRANSACTIONS = [
  { type: "buy" as const, asset: "BTC", via: "Moov Money", date: "Aujourd'hui 14:32", amount: "+0.0024 BTC", color: "yellow" },
  { type: "send" as const, asset: "USDT", via: "Binance", date: "Hier 09:15", amount: "-50 USDT", color: "loss" },
  { type: "receive" as const, asset: "ETH", via: "Externe", date: "08/03/2026", amount: "+0.15 ETH", color: "gain" },
  { type: "buy" as const, asset: "USDT", via: "Orange Money", date: "05/03/2026", amount: "+100 USDT", color: "yellow" },
];

export function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR").replace(/,/g, " ");
}
