import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AssetSymbol, NetworkId } from "@/lib/assets";
import { DEMO_MODE, KYC_LEVELS, type CountryCode, type InstitutionType, type KycLevel } from "@/lib/config";
import type { Currency } from "@/lib/format";
import { translate, type Lang, type TKey } from "@/lib/i18n";

// ───────────────────────── Types ─────────────────────────

export type TxType = "buy" | "sell" | "send" | "receive" | "swap" | "airtime";

export interface Transaction {
  id: string;
  type: TxType;
  asset: AssetSymbol;
  amount: number;
  /** Valeur en FCFA au moment de la transaction */
  fcfa: number;
  /** Frais totaux en FCFA */
  feeFCFA: number;
  counterparty: string;
  network?: NetworkId;
  toAsset?: AssetSymbol;
  toAmount?: number;
  status: "completed" | "pending" | "failed";
  ts: number;
  /** Compte dans les plafonds KYC (entrées/sorties de valeur) */
  countsForLimits: boolean;
}

/** Adresse autorisée pour les retraits (liste blanche, active après un délai de sécurité) */
export interface WhitelistEntry {
  address: string;
  network: NetworkId;
  label: string;
  activeAt: number;
}

/** Achat programmé individuel (DCA) — une demande PI-SPI à valider à chaque échéance */
export interface RecurringPlan {
  id: string;
  asset: AssetSymbol;
  amountFCFA: number;
  frequency: "weekly" | "monthly";
  nextRun: number;
  active: boolean;
}

export interface PriceAlert {
  id: string;
  asset: AssetSymbol;
  direction: "above" | "below";
  priceFCFA: number;
}

export interface Ticket {
  id: string;
  subject: string;
  message: string;
  ts: number;
  status: "Ouvert" | "Résolu";
}

export interface LoginEvent {
  ts: number;
  device: string;
  method: "PIN" | "Biométrie";
}

export interface ChatMessage {
  from: "user" | "agent";
  text: string;
  ts: number;
}

export interface SavedAddress {
  label: string;
  asset: AssetSymbol;
  network: NetworkId;
  address: string;
}

/** Compte de paiement joignable via PI-SPI (alias = numéro de téléphone) */
export interface PayAccount {
  id: string;
  alias: string;
  institution: string;
  type: InstitutionType;
  /** Titulaire renvoyé par la résolution d'alias PI-SPI */
  holder: string;
}

export interface User {
  country: CountryCode;
  phone: string;
  name: string;
  handle: string;
  pinHash: string;
  biometrics: boolean;
  lang: Lang;
  currency: Currency;
  kycLevel: KycLevel;
  kycPending: KycLevel | null;
  kycSubmittedAt: number | null;
  consentAt: number;
  twoFA: "sms" | "app" | null;
  payAccounts: PayAccount[];
}

export interface NotificationPrefs {
  transactions: boolean;
  market: boolean;
  security: boolean;
  promos: boolean;
  push: boolean;
  sms: boolean;
  email: boolean;
}

export interface AppState {
  user: User | null;
  tutorialSeen: boolean;
  holdings: Partial<Record<AssetSymbol, number>>;
  transactions: Transaction[];
  favorites: AssetSymbol[];
  notifications: NotificationPrefs;
  dataSaver: boolean;
  balanceHidden: boolean;
  alerts: PriceAlert[];
  tickets: Ticket[];
  logins: LoginEvent[];
  chat: ChatMessage[];
  savedAddresses: SavedAddress[];
  whitelistEnabled: boolean;
  whitelist: WhitelistEntry[];
  withdrawalsFrozen: boolean;
  recurring: RecurringPlan[];
  lessonsDone: string[];
  referralsInvited: number;
}

const STORAGE_KEY = "cryptopay-niger:v1";

const initialState: AppState = {
  user: null,
  tutorialSeen: false,
  holdings: {},
  transactions: [],
  favorites: ["BTC", "USDT"],
  notifications: { transactions: true, market: true, security: true, promos: false, push: true, sms: true, email: false },
  dataSaver: false,
  balanceHidden: false,
  alerts: [],
  tickets: [],
  logins: [],
  chat: [],
  savedAddresses: [],
  whitelistEnabled: false,
  whitelist: [],
  withdrawalsFrozen: false,
  recurring: [],
  lessonsDone: [],
  referralsInvited: 0,
};

// ───────────────────────── Utilitaires ─────────────────────────

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/**
 * Empreinte du PIN pour le prototype. En production, le PIN est vérifié côté
 * serveur (Auth Service) et protégé par le Keystore/Keychain de l'appareil.
 */
export function hashPin(pin: string): string {
  let h = 0x811c9dc5;
  const s = `cpn-salt:${pin}`;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}

export function deviceName(): string {
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : "Appareil";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  return `${browser} · ${os}`;
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // Migration v0.2 (opérateurs Niger) → v0.3 (PI-SPI, UEMOA)
    if (parsed.user && !parsed.user.country) {
      parsed.user = {
        ...parsed.user,
        country: "NE",
        payAccounts: [{ id: uid(), alias: parsed.user.phone, institution: "Mon wallet Mobile Money", type: "eme", holder: parsed.user.name }],
      };
    }
    return { ...initialState, ...parsed, notifications: { ...initialState.notifications, ...parsed.notifications } };
  } catch {
    return initialState;
  }
}

function demoSeed(): Pick<AppState, "holdings" | "transactions"> {
  const now = Date.now();
  const day = 86_400_000;
  return {
    holdings: { BTC: 0.0058, ETH: 0.032, USDT: 120 },
    transactions: [
      { id: uid(), type: "buy", asset: "BTC", amount: 0.0024, fcfa: 87_600, feeFCFA: 1_752, counterparty: "PI-SPI · Mobile Money", status: "completed", ts: now - 3 * 3_600_000 - 40 * day, countsForLimits: false },
      { id: uid(), type: "send", asset: "USDT", amount: 50, fcfa: 30_000, feeFCFA: 750, counterparty: "Binance", network: "TRC20", status: "completed", ts: now - 41 * day, countsForLimits: false },
      { id: uid(), type: "receive", asset: "ETH", amount: 0.032, fcfa: 46_400, feeFCFA: 0, counterparty: "Externe", network: "ERC20", status: "completed", ts: now - 45 * day, countsForLimits: false },
      { id: uid(), type: "buy", asset: "USDT", amount: 170, fcfa: 102_000, feeFCFA: 2_040, counterparty: "PI-SPI · Mobile Money", status: "completed", ts: now - 48 * day, countsForLimits: false },
      { id: uid(), type: "buy", asset: "BTC", amount: 0.0034, fcfa: 124_100, feeFCFA: 2_482, counterparty: "PI-SPI · Banque", status: "completed", ts: now - 52 * day, countsForLimits: false },
    ],
  };
}

// ───────────────────────── Contexte ─────────────────────────

interface Usage {
  day: number;
  month: number;
  dailyLimit: number | null;
  monthlyLimit: number | null;
}

interface AppStore {
  state: AppState;
  locked: boolean;
  t: (key: TKey) => string;
  update: (fn: (s: AppState) => AppState) => void;
  completeOnboarding: (u: Omit<User, "kycLevel" | "kycPending" | "kycSubmittedAt" | "twoFA" | "currency" | "payAccounts">) => void;
  unlock: (method: LoginEvent["method"]) => void;
  lock: () => void;
  logout: () => void;
  deleteAccount: () => void;
  addTransaction: (tx: Omit<Transaction, "id" | "ts" | "status"> & { status?: Transaction["status"] }) => Transaction;
  adjustHolding: (asset: AssetSymbol, delta: number) => void;
  usage: Usage;
  /** Montant FCFA encore autorisé aujourd'hui (Infinity si illimité) */
  remainingAllowance: number;
}

const Ctx = createContext<AppStore | null>(null);

const AUTO_LOCK_MS = 2 * 60_000;

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [locked, setLocked] = useState<boolean>(() => !!load().user);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* stockage plein ou indisponible */
    }
  }, [state]);

  // Verrouillage automatique après 2 min en arrière-plan
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current > AUTO_LOCK_MS && state.user) setLocked(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [state.user]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const lang = state.user?.lang ?? "fr";
  const t = useCallback((key: TKey) => translate(lang, key), [lang]);

  const completeOnboarding: AppStore["completeOnboarding"] = useCallback((u) => {
    setState((s) => ({
      ...s,
      ...(DEMO_MODE ? demoSeed() : {}),
      user: {
        ...u,
        kycLevel: 0,
        kycPending: null,
        kycSubmittedAt: null,
        twoFA: "sms",
        currency: "FCFA",
        payAccounts: [{ id: uid(), alias: u.phone, institution: "Mon wallet Mobile Money", type: "eme", holder: u.name }],
      },
      logins: [{ ts: Date.now(), device: deviceName(), method: "PIN" }],
    }));
    setLocked(false);
  }, []);

  const unlock = useCallback((method: LoginEvent["method"]) => {
    setState((s) => ({ ...s, logins: [{ ts: Date.now(), device: deviceName(), method }, ...s.logins].slice(0, 30) }));
    setLocked(false);
  }, []);

  const lock = useCallback(() => setLocked(true), []);
  const logout = useCallback(() => setLocked(true), []);

  const deleteAccount = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
    setLocked(false);
  }, []);

  const addTransaction: AppStore["addTransaction"] = useCallback((tx) => {
    const full: Transaction = { status: "completed", ...tx, id: uid(), ts: Date.now() };
    setState((s) => ({ ...s, transactions: [full, ...s.transactions] }));
    return full;
  }, []);

  const adjustHolding = useCallback((asset: AssetSymbol, delta: number) => {
    setState((s) => {
      const next = Math.max(0, (s.holdings[asset] ?? 0) + delta);
      return { ...s, holdings: { ...s.holdings, [asset]: Number(next.toFixed(10)) } };
    });
  }, []);

  const usage = useMemo<Usage>(() => {
    const now = new Date();
    const dayAgo = Date.now() - 86_400_000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let day = 0;
    let month = 0;
    for (const tx of state.transactions) {
      if (!tx.countsForLimits || tx.status === "failed") continue;
      if (tx.ts >= dayAgo) day += tx.fcfa;
      if (tx.ts >= monthStart) month += tx.fcfa;
    }
    const lvl = KYC_LEVELS[state.user?.kycLevel ?? 0];
    return { day, month, dailyLimit: lvl.daily, monthlyLimit: lvl.monthly };
  }, [state.transactions, state.user?.kycLevel]);

  const remainingAllowance =
    usage.dailyLimit === null || usage.monthlyLimit === null
      ? Infinity
      : Math.max(0, Math.min(usage.dailyLimit - usage.day, usage.monthlyLimit - usage.month));

  const value: AppStore = {
    state,
    locked,
    t,
    update,
    completeOnboarding,
    unlock,
    lock,
    logout,
    deleteAccount,
    addTransaction,
    adjustHolding,
    usage,
    remainingAllowance,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp doit être utilisé dans <AppStoreProvider>");
  return ctx;
}
