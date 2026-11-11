import { useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { ASSETS, type AssetSymbol } from "@/lib/assets";
import { FEES } from "@/lib/config";
import { formatCrypto, formatMoney } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { usePrices } from "@/hooks/usePrices";
import { useLockedQuote } from "@/hooks/useLockedQuote";
import { Chip, InfoNote, Numpad, PinPrompt, PrimaryButton, QuoteBadge, Sheet, SuccessOverlay, SummaryRows, TopBar, applyNumpadKey } from "@/components/kit";

export default function SwapScreen({ initialAsset }: { initialAsset?: AssetSymbol }) {
  const { state, t, addTransaction, adjustHolding } = useApp();
  const { back, go } = useNav();
  const { prices } = usePrices();
  const held = ASSETS.filter((a) => (state.holdings[a.symbol] ?? 0) > 0);
  const [from, setFrom] = useState<AssetSymbol>(initialAsset ?? held[0]?.symbol ?? "BTC");
  const [to, setTo] = useState<AssetSymbol>(from === "USDT" ? "BTC" : "USDT");
  const [amount, setAmount] = useState("0");
  const [stage, setStage] = useState<"form" | "confirm" | "pin" | "success">("form");

  const balance = state.holdings[from] ?? 0;
  const num = parseFloat(amount) || 0;
  // Taux croisé figé pendant la confirmation (devis garanti)
  const quote = useLockedQuote(prices[from].fcfa / prices[to].fcfa, stage === "confirm" || stage === "pin");
  const valueFCFA = num * prices[from].fcfa;
  const fee = valueFCFA * FEES.spread;
  const received = num * quote.rate * (1 - FEES.spread);
  const insufficient = num > balance + 1e-12;
  const ok = num > 0 && !insufficient && from !== to;

  const flip = () => {
    setFrom(to);
    setTo(from);
    setAmount("0");
  };

  const execute = () => {
    adjustHolding(from, -num);
    adjustHolding(to, received);
    addTransaction({ type: "swap", asset: from, amount: num, toAsset: to, toAmount: received, fcfa: Math.round(valueFCFA), feeFCFA: Math.round(fee), counterparty: to, countsForLimits: false });
    setStage("success");
  };

  if (stage === "success") {
    return <SuccessOverlay title="Échange réussi !" subtitle={`+${formatCrypto(received, to)}`} detail={`-${formatCrypto(num, from)}`} onDone={() => go({ name: "wallet" })} />;
  }

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title={t("action.swap")} onBack={back} />
      <div className="bg-card-dark rounded-[20px] p-5 relative">
        <div className="font-urbanist text-text-gray text-[10px] uppercase tracking-wider mb-2">De</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
          {ASSETS.map((a) => (
            <Chip
              key={a.symbol}
              onDark
              active={from === a.symbol}
              onClick={() => {
                setFrom(a.symbol);
                if (a.symbol === to) setTo(from);
                setAmount("0");
              }}
            >
              {a.symbol}
            </Chip>
          ))}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-urbanist font-black text-white text-[36px] italic">{amount}</span>
          <button onClick={() => setAmount(String(balance))} className="bg-yellow text-card-dark font-urbanist font-bold text-[11px] px-2.5 py-0.5 rounded-full press-scale">
            MAX
          </button>
        </div>
        <div className="font-urbanist text-text-gray text-[11px]">Disponible : {formatCrypto(balance, from)}</div>
        <button onClick={flip} aria-label="Inverser" className="absolute left-1/2 -translate-x-1/2 -bottom-5 w-10 h-10 rounded-full bg-yellow flex items-center justify-center press-scale ring-4 ring-cream z-10">
          <ArrowDownUp size={18} className="text-card-dark" />
        </button>
      </div>
      <div className="bg-white rounded-[20px] p-5 pt-6">
        <div className="font-urbanist text-text-gray text-[10px] uppercase tracking-wider mb-2">Vers</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
          {ASSETS.filter((a) => a.symbol !== from).map((a) => (
            <Chip key={a.symbol} active={to === a.symbol} onClick={() => setTo(a.symbol)}>
              {a.symbol}
            </Chip>
          ))}
        </div>
        <div className="font-urbanist font-black text-card-dark text-[28px] italic">≈ {formatCrypto(received > 0 ? received : 0, to)}</div>
        <div className="font-urbanist text-text-gray text-[11px]">
          1 {from} ≈ {formatCrypto((prices[from].fcfa * (1 - FEES.spread)) / prices[to].fcfa, to)}
        </div>
      </div>
      {insufficient && <InfoNote tone="red">Solde insuffisant.</InfoNote>}
      <Numpad onKey={(k) => setAmount((p) => applyNumpadKey(p, k, 8))} />
      <PrimaryButton disabled={!ok} onClick={() => setStage("confirm")}>
        {t("action.continue")}
      </PrimaryButton>
      {stage === "confirm" && (
        <Sheet onClose={() => setStage("form")} title="Confirmer l'échange">
          <QuoteBadge secondsLeft={quote.secondsLeft} expired={quote.expired} onRefresh={quote.refresh} />
          <div className="mb-5">
            <SummaryRows
              rows={[
                ["Vous donnez", formatCrypto(num, from)],
                ["Valeur", formatMoney(valueFCFA)],
                ["Frais de change", formatMoney(fee)],
                ["Vous recevez", `≈ ${formatCrypto(received, to)}`],
              ]}
            />
          </div>
          <PrimaryButton disabled={quote.expired} onClick={() => setStage("pin")}>
            CONFIRMER L'ÉCHANGE
          </PrimaryButton>
        </Sheet>
      )}
      {stage === "pin" && <PinPrompt onClose={() => setStage("form")} onSuccess={execute} />}
    </div>
  );
}
