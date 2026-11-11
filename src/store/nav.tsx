import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { AssetSymbol } from "@/lib/assets";

export type Tab = "home" | "market" | "wallet" | "profile";

export type Route =
  | { name: Tab }
  | { name: "buy"; asset?: AssetSymbol; amount?: number }
  | { name: "send"; asset?: AssetSymbol }
  | { name: "sell"; asset?: AssetSymbol }
  | { name: "swap"; asset?: AssetSymbol }
  | { name: "history" }
  | { name: "security" }
  | { name: "kyc" }
  | { name: "notifications" }
  | { name: "language" }
  | { name: "limits" }
  | { name: "support" }
  | { name: "legal" }
  | { name: "accounts" }
  | { name: "airtime" }
  | { name: "recurring" }
  | { name: "referral" }
  | { name: "learn" }
  | { name: "transparency" }
  | { name: "status" };

interface Nav {
  route: Route;
  tab: Tab;
  go: (r: Route) => void;
  back: () => void;
  receive: AssetSymbol | null | false;
  openReceive: (asset?: AssetSymbol) => void;
  closeReceive: () => void;
}

const Ctx = createContext<Nav | null>(null);

const TAB_OF: Record<string, Tab> = {
  home: "home", buy: "home", send: "home", sell: "wallet", swap: "wallet", history: "wallet",
  market: "market", wallet: "wallet", profile: "profile",
  security: "profile", kyc: "profile", notifications: "profile", language: "profile", limits: "profile", support: "profile", legal: "profile", accounts: "profile",
  airtime: "home", recurring: "home", referral: "profile", learn: "home", transparency: "profile", status: "profile",
};

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: "home" }]);
  const [receive, setReceive] = useState<AssetSymbol | null | false>(false);

  const go = useCallback((r: Route) => {
    const isTab = r.name === "home" || r.name === "market" || r.name === "wallet" || r.name === "profile";
    setStack((s) => (isTab ? [r] : [...s, r]));
    window.scrollTo({ top: 0 });
  }, []);
  const back = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ name: "home" }]));
    window.scrollTo({ top: 0 });
  }, []);

  const route = stack[stack.length - 1];
  const value: Nav = {
    route,
    tab: TAB_OF[route.name] ?? "home",
    go,
    back,
    receive,
    openReceive: (a) => setReceive(a ?? null),
    closeReceive: () => setReceive(false),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNav doit être utilisé dans <NavProvider>");
  return ctx;
}
