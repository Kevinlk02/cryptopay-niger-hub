import { Eye, EyeOff, ShoppingCart, ArrowUp, ArrowDown, ClipboardList, ShieldAlert, ChevronRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { ASSETS } from "@/lib/assets";
import { formatCrypto, formatMoney, formatMoneyValue, formatNumber, formatPercent } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { useCandles, usePortfolio, usePrices } from "@/hooks/usePrices";
import { CoinIcon, NetworkBanner, SectionHeader } from "@/components/kit";
import { Sparkline } from "@/components/kit/charts";
import { DueRecurringBanner, HomeServices } from "./services/HomeServices";
import type { AssetSymbol } from "@/lib/assets";

function AssetSpark({ symbol }: { symbol: AssetSymbol }) {
  const { data } = useCandles(symbol, "1S");
  return <Sparkline values={data?.map((c) => c.c) ?? []} width={44} height={22} />;
}

export default function HomeScreen() {
  const { state, update, t } = useApp();
  const { go, openReceive } = useNav();
  const { prices } = usePrices();
  const portfolio = usePortfolio();
  const user = state.user!;
  const hidden = state.balanceHidden;
  const currency = user.currency;
  const up = portfolio.change24h >= 0;

  const quickActions = [
    { icon: ShoppingCart, label: t("action.buy"), onClick: () => go({ name: "buy" }) },
    { icon: ArrowUp, label: t("action.send"), onClick: () => go({ name: "send" }) },
    { icon: ArrowDown, label: t("action.receive"), onClick: () => openReceive() },
    { icon: ClipboardList, label: t("action.history"), onClick: () => go({ name: "history" }) },
  ];

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-8 rounded-[8px] object-cover" />
          <span className="font-urbanist font-bold text-card-dark text-lg">CryptoPay</span>
        </div>
        <button onClick={() => go({ name: "profile" })} aria-label="Profil" className="press-scale w-9 h-9 rounded-full bg-yellow flex items-center justify-center">
          <span className="font-urbanist font-extrabold text-card-dark text-xs">
            {user.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
        </button>
      </div>

      <NetworkBanner />

      {/* Balance Card */}
      <div className="bg-card-dark rounded-[20px] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-urbanist font-medium text-text-gray text-xs">{t("home.total")}</span>
          <div className="flex items-center gap-2">
            <span className={`font-urbanist font-bold text-[10px] px-2.5 py-0.5 rounded-full ${up ? "bg-yellow text-card-dark" : "bg-loss text-white"}`}>
              {formatPercent(portfolio.change24h)} {t("home.today")}
            </span>
            <button
              onClick={() => update((s) => ({ ...s, balanceHidden: !s.balanceHidden }))}
              aria-label={hidden ? "Afficher le solde" : "Masquer le solde"}
              className="press-scale w-7 h-7 rounded-full bg-[#2A2A2A] flex items-center justify-center"
            >
              {hidden ? <EyeOff size={14} className="text-white" /> : <Eye size={14} className="text-white" />}
            </button>
          </div>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-urbanist font-black text-white text-[44px] leading-tight italic">{hidden ? "••• •••" : formatMoneyValue(portfolio.totalFCFA, currency)}</span>
          <span className="font-urbanist font-semibold text-white text-xl">{currency === "FCFA" ? "FCFA" : currency === "USD" ? "$" : "€"}</span>
        </div>
      </div>

      <DueRecurringBanner />

      {/* KYC nudge */}
      {user.kycLevel === 0 && !user.kycPending && (
        <button onClick={() => go({ name: "kyc" })} className="press-scale w-full bg-white rounded-[20px] p-4 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-full bg-yellow flex items-center justify-center shrink-0">
            <ShieldAlert size={18} className="text-card-dark" />
          </div>
          <div className="flex-1">
            <div className="font-urbanist font-bold text-card-dark text-sm">Vérifiez votre identité</div>
            <div className="font-urbanist text-text-gray text-[11px]">Passez de 10 000 à 100 000 FCFA/jour</div>
          </div>
          <ChevronRight size={16} className="text-text-gray" />
        </button>
      )}

      {/* Quick Actions */}
      <div>
        <SectionHeader title={t("home.quick")} />
        <div className="flex justify-between">
          {quickActions.map((qa) => (
            <button key={qa.label} onClick={qa.onClick} className="press-scale flex flex-col items-center gap-1.5 group w-[72px]">
              <div className="w-12 h-12 rounded-full bg-card-dark flex items-center justify-center group-active:bg-yellow transition-colors duration-100">
                <qa.icon size={20} className="text-white group-active:text-card-dark" />
              </div>
              <span className="font-urbanist font-semibold text-card-dark text-[11px]">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>

      <HomeServices />

      {/* Marché */}
      <div>
        <SectionHeader title={t("nav.market")} action={t("action.seeAll")} onAction={() => go({ name: "market" })} />
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          {ASSETS.map((a) => {
            const p = prices[a.symbol];
            return (
              <button key={a.symbol} onClick={() => go({ name: "market" })} className="min-w-[150px] bg-card-dark rounded-[20px] p-3 press-scale text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <CoinIcon symbol={a.symbol} size={20} />
                    <span className="font-urbanist font-bold text-white text-[13px]">{a.symbol}</span>
                  </div>
                  <span className={`font-urbanist font-bold text-[10px] px-1.5 py-0.5 rounded-full ${p.change24h >= 0 ? "bg-yellow text-card-dark" : "bg-loss text-white"}`}>
                    {formatPercent(p.change24h)}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="font-urbanist font-extrabold text-white text-base">{formatNumber(p.fcfa, p.fcfa < 1000 ? 1 : 0)}</div>
                    <div className="font-urbanist text-text-gray text-[11px]">FCFA</div>
                  </div>
                  <AssetSpark symbol={a.symbol} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actifs */}
      <div>
        <SectionHeader title={t("home.assets")} action={t("action.seeAll")} onAction={() => go({ name: "wallet" })} />
        {portfolio.rows.length === 0 ? (
          <div className="bg-white rounded-[20px] p-5 text-center">
            <p className="font-urbanist text-text-gray text-sm mb-3">{t("home.empty")}</p>
            <button onClick={() => go({ name: "buy" })} className="press-scale bg-yellow rounded-full px-5 h-10 font-urbanist font-extrabold text-card-dark text-sm">
              {t("action.buy")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {portfolio.rows.map((r) => (
              <button key={r.asset.symbol} onClick={() => go({ name: "wallet" })} className="w-full bg-white rounded-[20px] p-4 flex items-center justify-between gap-2 press-scale">
                <div className="flex items-center gap-3 min-w-0">
                  <CoinIcon symbol={r.asset.symbol} />
                  <div className="text-left min-w-0">
                    <div className="font-urbanist font-bold text-card-dark text-sm">{r.asset.name}</div>
                    <div className="font-urbanist text-text-gray text-[11px]">{formatPercent(r.change24h)}</div>
                  </div>
                </div>
                <AssetSpark symbol={r.asset.symbol} />
                <div className="text-right">
                  <div className="font-urbanist font-bold text-card-dark text-sm">{hidden ? "•••" : formatCrypto(r.amount, r.asset.symbol)}</div>
                  <div className="font-urbanist text-text-gray text-[11px]">{hidden ? "•••" : formatMoney(r.valueFCFA, currency)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
