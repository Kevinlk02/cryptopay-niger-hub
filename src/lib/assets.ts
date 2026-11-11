// Catalogue des crypto-actifs et réseaux (CDC 3.1.2 & 4.5)

export type NetworkId = "BTC" | "LN" | "ERC20" | "TRC20" | "BEP20" | "SOL";

export interface Network {
  id: NetworkId;
  label: string;
  /** Regex de validation de format d'adresse */
  pattern: RegExp;
  example: string;
}

export const NETWORKS: Record<NetworkId, Network> = {
  BTC: {
    id: "BTC",
    label: "BTC Network",
    pattern: /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
    example: "bc1q… / 1… / 3…",
  },
  LN: {
    id: "LN",
    label: "Lightning",
    // Facture BOLT11 (mainnet) : instantanée, frais quasi nuls
    pattern: /^lnbc[0-9a-z]{50,}$/i,
    example: "facture lnbc… (Lightning)",
  },
  ERC20: { id: "ERC20", label: "ERC-20", pattern: /^0x[a-fA-F0-9]{40}$/, example: "0x… (42 caractères)" },
  BEP20: { id: "BEP20", label: "BEP-20", pattern: /^0x[a-fA-F0-9]{40}$/, example: "0x… (42 caractères)" },
  TRC20: { id: "TRC20", label: "TRC-20", pattern: /^T[1-9A-HJ-NP-Za-km-z]{33}$/, example: "T… (34 caractères)" },
  SOL: { id: "SOL", label: "Solana", pattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, example: "Base58 (32-44 caractères)" },
};

export type AssetSymbol = "BTC" | "ETH" | "USDT" | "USDC" | "BNB" | "SOL";

export interface Asset {
  symbol: AssetSymbol;
  name: string;
  color: string;
  stable: boolean;
  /** Paire Binance cotée en USDT (null = stablecoin à 1 $) */
  pair: string | null;
  /** Réseaux supportés et frais réseau estimés (en unités de l'actif) */
  networks: { id: NetworkId; fee: number }[];
  decimals: number;
  /** Prix de repli (USD) si l'API est indisponible — valeurs du CDC */
  fallbackUSD: number;
  buyable: boolean;
}

export const ASSETS: Asset[] = [
  { symbol: "BTC", name: "Bitcoin", color: "#F7931A", stable: false, pair: "BTCUSDT", networks: [{ id: "BTC", fee: 0.00005 }, { id: "LN", fee: 0.0000001 }], decimals: 8, fallbackUSD: 64_231, buyable: true },
  { symbol: "ETH", name: "Ethereum", color: "#627EEA", stable: false, pair: "ETHUSDT", networks: [{ id: "ERC20", fee: 0.0008 }], decimals: 6, fallbackUSD: 3_452, buyable: true },
  {
    symbol: "USDT", name: "Tether", color: "#26A17B", stable: true, pair: null,
    networks: [{ id: "TRC20", fee: 1 }, { id: "ERC20", fee: 4 }, { id: "BEP20", fee: 0.3 }],
    decimals: 2, fallbackUSD: 1, buyable: true,
  },
  { symbol: "USDC", name: "USD Coin", color: "#2775CA", stable: true, pair: "USDCUSDT", networks: [{ id: "ERC20", fee: 4 }], decimals: 2, fallbackUSD: 1, buyable: true },
  { symbol: "BNB", name: "BNB", color: "#F3BA2F", stable: false, pair: "BNBUSDT", networks: [{ id: "BEP20", fee: 0.0005 }], decimals: 5, fallbackUSD: 410, buyable: false },
  { symbol: "SOL", name: "Solana", color: "#9945FF", stable: false, pair: "SOLUSDT", networks: [{ id: "SOL", fee: 0.008 }], decimals: 4, fallbackUSD: 145, buyable: false },
];

export const ASSET_MAP = Object.fromEntries(ASSETS.map((a) => [a.symbol, a])) as Record<AssetSymbol, Asset>;
export const BUYABLE = ASSETS.filter((a) => a.buyable).map((a) => a.symbol);

/** Pseudonyme interne CryptoPay : @nom (transfert gratuit entre utilisateurs) */
export const INTERNAL_HANDLE = /^@[a-z0-9_.]{3,20}$/i;
/** Numéro de téléphone UEMOA d'un utilisateur CryptoPay (envoi gratuit par numéro) */
export const INTERNAL_PHONE = /^\+(229|226|225|245|223|227|221|228)\d{8,10}$/;

export const isInternalRecipient = (a: string) => INTERNAL_HANDLE.test(a.trim()) || INTERNAL_PHONE.test(a.replace(/\s/g, ""));

export type AddressCheck =
  | { ok: true; kind: "internal" | "external" }
  | { ok: false; reason: string };

export function validateAddress(address: string, network: NetworkId): AddressCheck {
  const a = address.trim();
  if (!a) return { ok: false, reason: "Saisissez une adresse, un @utilisateur ou un numéro" };
  if (a.startsWith("+")) {
    return INTERNAL_PHONE.test(a.replace(/\s/g, ""))
      ? { ok: true, kind: "internal" }
      : { ok: false, reason: "Numéro invalide : indicatif UEMOA requis (ex. +225 07…)" };
  }
  if (a.startsWith("@")) {
    return INTERNAL_HANDLE.test(a)
      ? { ok: true, kind: "internal" }
      : { ok: false, reason: "Nom d'utilisateur invalide (3 à 20 caractères)" };
  }
  const net = NETWORKS[network];
  if (net.pattern.test(a)) return { ok: true, kind: "external" };
  // Détection d'un mauvais réseau pour aider l'utilisateur
  const match = (Object.values(NETWORKS) as Network[]).find((n) => n.id !== network && n.pattern.test(a));
  if (match && !(match.id === "BEP20" && network === "ERC20") && !(match.id === "ERC20" && network === "BEP20")) {
    return { ok: false, reason: `Cette adresse ressemble à une adresse ${match.label}, pas ${net.label}` };
  }
  return { ok: false, reason: `Format invalide pour ${net.label} (attendu : ${net.example})` };
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BECH = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Adresse de réception de démonstration, déterministe par utilisateur + réseau.
 * En production elle sera fournie par le custodian (Fireblocks / BitGo).
 */
export function demoAddress(userSeed: string, network: NetworkId): string {
  const r = seeded(`${userSeed}:${network}`);
  const pick = (alphabet: string, n: number) => Array.from({ length: n }, () => alphabet[Math.floor(r() * alphabet.length)]).join("");
  switch (network) {
    case "BTC":
      return "bc1q" + pick(BECH, 38);
    case "LN":
      return "lnbc1" + pick(BECH, 180);
    case "ERC20":
    case "BEP20":
      return "0x" + pick("0123456789abcdef", 40);
    case "TRC20":
      return "T" + pick(B58, 33);
    case "SOL":
      return pick(B58, 44);
  }
}

/**
 * Détection d'« empoisonnement d'adresse » : une adresse qui reprend le début
 * et la fin d'une adresse déjà utilisée mais diffère au milieu (arnaque courante).
 */
export function findLookalike(address: string, known: string[]): string | null {
  const a = address.trim();
  if (a.length < 20) return null;
  return (
    known.find((k) => k !== a && k.length === a.length && k.slice(0, 5) === a.slice(0, 5) && k.slice(-4) === a.slice(-4)) ?? null
  );
}
