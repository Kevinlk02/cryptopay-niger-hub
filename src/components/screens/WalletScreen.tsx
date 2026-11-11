import { useState } from "react";
import { QrCode, ArrowUp, ArrowDown, ShoppingCart } from "lucide-react";
import { formatCrypto, formatMoney, formatMoneyValue, formatPercent } from "@/lib/format";
import { useApp, type Transaction } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { usePortfolio } from "@/hooks/usePrices";
import { CoinIcon, SectionHeader } from "@/components/kit";
import { TxDetail, TxRow } from "./HistoryScreen";
import type { AssetSymbol } from "@/lib/assets";

export default function WalletScreen() {
  const { state, t } = useApp();
  const { go, openReceive } = useNav();
  const portfolio = usePortfolio();
  const [open, setOpen] = useState<AssetSymbol | null>(null);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const currency = state.user!.currency;
  const hidden = state.balanceHidden;

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-urbanist font-extrabold text-card-dark text-xl">{t("wallet.title")}</span>
        <button onClick={() => openReceive()} aria-label="Mon adresse QR" className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center press-scale">
          <QrCode size={18} className="text-white" />
        </button>
      </div>

      <div className="bg-card-dark rounded-[20px] p-5">
        <div className="font-urbanist font-medium text-text-gray text-xs mb-1">{t("wallet.balance")}</div>
        <div className="flex items-baseline gap-2 mb-4 flex-wrap">
          <span className="font-urbanist font-black text-white text-[44px] leading-tight italic">{hidden ? "••• •••" : formatMoneyValue(portfolio.totalFCFA, currency)}</span>
          <span className="font-urbanist font-semibold text-white text-xl">{currency === "FCFA" ? "FCFA" : currency === "USD" ? "$" : "€"}</span>
        </div>
        <div className="flex gap-2">
          {[
            { label: t("action.deposit"), fn: () => openReceive() },
            { label: t("action.withdraw"), fn: () => go({ name: "sell" }) },
            { label: t("action.swap"), fn: () => go({ name: "swap" }) },
          ].map((b) => (
            <button key={b.label} onClick={b.fn} className="press-scale flex-1 h-10 rounded-full bg-yellow font-urbanist font-bold text-card-dark text-xs">
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader title={t("home.assets")} />
        {portfolio.rows.length === 0 ? (
          <div className="bg-white rounded-[20px] p-5 text-center font-urbanist text-text-gray text-sm">{t("home.empty")}</div>
        ) : (
          <div className="space-y-3">
            {portfolio.rows.map((r) => (
              <div key={r.asset.symbol} className="bg-white rounded-[20px] overflow-hidden">
                <button onClick={() => setOpen(open === r.asset.symbol ? null : r.asset.symbol)} className="w-full p-4 flex items-center justify-between press-scale">
                  <div className="flex items-center gap-3">
                    <CoinIcon symbol={r.asset.symbol} />
                    <div className="text-left">
                      <div className="font-urbanist font-bold text-card-dark text-sm">{r.asset.name}</div>
                      <div className={`font-urbanist text-[11px] ${r.change24h >= 0 ? "text-gain" : "text-loss"}`}>{formatPercent(r.change24h)} 24h</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-urbanist font-bold text-card-dark text-sm">{hidden ? "•••" : formatCrypto(r.amount, r.asset.symbol)}</div>
                    <div className="font-urbanist text-text-gray text-[11px]">{hidden ? "•••" : formatMoney(r.valueFCFA, currency)}</div>
                  </div>
                </button>
                {open === r.asset.symbol && (
                  <div className="flex gap-2 px-4 pb-4">
                    {[
                      { icon: ArrowUp, label: t("action.send"), fn: () => go({ name: "send", asset: r.asset.symbol }) },
                      { icon: ArrowDown, label: t("action.receive"), fn: () => openReceive(r.asset.symbol) },
                      ...(r.asset.buyable ? [{ icon: ShoppingCart, label: t("action.buy"), fn: () => go({ name: "buy", asset: r.asset.symbol }) }] : []),
                    ].map((a) => (
                      <button key={a.label} onClick={a.fn} className="press-scale flex-1 h-9 rounded-full bg-card-dark text-white font-urbanist font-bold text-xs flex items-center justify-center gap-1">
                        <a.icon size={13} /> {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeader title={t("wallet.recent")} action={t("action.seeAll")} onAction={() => go({ name: "history" })} />
        <div className="space-y-3">
          {state.transactions.slice(0, 5).map((tx) => (
            <TxRow key={tx.id} tx={tx} hidden={hidden} onClick={() => setDetail(tx)} />
          ))}
          {state.transactions.length === 0 && <p className="font-urbanist text-text-gray text-sm text-center py-4">Aucune transaction</p>}
        </div>
      </div>
      {detail && <TxDetail tx={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
