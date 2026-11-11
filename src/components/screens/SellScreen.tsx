import { useState } from "react";
import { ASSETS, type AssetSymbol } from "@/lib/assets";
import { FEES, PISPI } from "@/lib/config";
import { formatCrypto, formatMoney } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { usePrices } from "@/hooks/usePrices";
import { useLockedQuote } from "@/hooks/useLockedQuote";
import { Chip, InfoNote, Numpad, PinPrompt, PrimaryButton, QuoteBadge, Sheet, SuccessOverlay, SummaryRows, TopBar, applyNumpadKey } from "@/components/kit";
import { PayAccountList } from "@/components/kit/PayAccounts";

/** Retirer : revente d'une crypto, paiement PI-SPI instantané vers un compte de l'utilisateur. */
export default function SellScreen({ initialAsset }: { initialAsset?: AssetSymbol }) {
  const { state, t, addTransaction, adjustHolding, remainingAllowance } = useApp();
  const { back, go } = useNav();
  const { prices } = usePrices();
  const held = ASSETS.filter((a) => (state.holdings[a.symbol] ?? 0) > 0);
  const [asset, setAsset] = useState<AssetSymbol>(initialAsset ?? held[0]?.symbol ?? "USDT");
  const [amount, setAmount] = useState("0");
  const [accountId, setAccountId] = useState<string | undefined>(state.user!.payAccounts[0]?.id);
  const [stage, setStage] = useState<"form" | "confirm" | "pin" | "success">("form");

  const user = state.user!;
  const balance = state.holdings[asset] ?? 0;
  const num = parseFloat(amount) || 0;
  const quote = useLockedQuote(prices[asset].sellFCFA, stage === "confirm" || stage === "pin");
  const gross = num * quote.rate;
  const commission = Math.round(gross * FEES.sellCommission);
  const net = Math.max(0, Math.round(gross - commission));
  const account = user.payAccounts.find((a) => a.id === accountId);
  const insufficient = num > balance + 1e-12;
  const overLimit = gross > remainingAllowance;
  const overPispi = net > PISPI.maxPerPayment;
  const ok = num > 0 && !insufficient && !overLimit && !overPispi && net >= 500 && !!account;

  const execute = () => {
    adjustHolding(asset, -num);
    addTransaction({ type: "sell", asset, amount: num, fcfa: Math.round(gross), feeFCFA: commission, counterparty: `PI-SPI · ${account!.institution}`, countsForLimits: true });
    setStage("success");
  };

  if (stage === "success") {
    return <SuccessOverlay title="Retrait envoyé !" subtitle={`+${formatMoney(net)}`} detail={`Crédité instantanément sur ${account!.institution} · ${account!.alias}`} onDone={() => go({ name: "wallet" })} />;
  }

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title={t("action.withdraw")} onBack={back} />
      {held.length === 0 ? (
        <InfoNote>Aucun actif à retirer pour l'instant.</InfoNote>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {held.map((a) => (
              <Chip
                key={a.symbol}
                active={asset === a.symbol}
                onClick={() => {
                  setAsset(a.symbol);
                  setAmount("0");
                }}
              >
                {a.symbol}
              </Chip>
            ))}
          </div>
          <div className="bg-card-dark rounded-[20px] p-5 text-center relative">
            <button onClick={() => setAmount(String(balance))} className="absolute top-4 right-4 bg-yellow text-card-dark font-urbanist font-bold text-[11px] px-2.5 py-0.5 rounded-full press-scale">
              MAX
            </button>
            <div className="font-urbanist font-black text-white text-[40px] italic leading-tight mt-2 break-all">{amount}</div>
            <div className="font-urbanist font-medium text-text-gray text-sm">{asset}</div>
            <div className="font-urbanist font-semibold text-yellow text-sm mt-1">Vous recevez ≈ {formatMoney(net)}</div>
            <div className="font-urbanist text-[#666] text-[11px] mt-1">Disponible : {formatCrypto(balance, asset)}</div>
          </div>
          {insufficient && <InfoNote tone="red">Solde insuffisant.</InfoNote>}
          {overLimit && !insufficient && <InfoNote tone="red">Plafond KYC dépassé pour aujourd'hui.</InfoNote>}
          {overPispi && <InfoNote tone="red">Maximum {formatMoney(PISPI.maxPerPayment)} par paiement PI-SPI.</InfoNote>}
          <Numpad onKey={(k) => setAmount((p) => applyNumpadKey(p, k, 8))} />
          <div>
            <span className="font-urbanist font-bold text-card-dark text-sm mb-1 block">Créditer sur</span>
            <span className="font-urbanist text-text-gray text-[11px] mb-3 block">Paiement PI-SPI : reçu en quelques secondes, 24h/24, dans les 8 pays UEMOA.</span>
            <PayAccountList selectedId={accountId} onSelect={setAccountId} />
          </div>
          <PrimaryButton disabled={!ok} onClick={() => setStage("confirm")}>
            {t("action.continue")}
          </PrimaryButton>
        </>
      )}
      {stage === "confirm" && (
        <Sheet onClose={() => setStage("form")} title="Confirmer le retrait">
          <QuoteBadge secondsLeft={quote.secondsLeft} expired={quote.expired} onRefresh={quote.refresh} />
          <div className="mb-5">
            <SummaryRows
              rows={[
                ["De", `Portefeuille ${asset}`],
                ["Vers", `${account?.institution} · ${account?.alias}`],
                ["Via", "PI-SPI (BCEAO) · instantané"],
                ["Montant", formatCrypto(num, asset)],
                ["Commission (1,5 %)", formatMoney(commission)],
                ["Vous recevez", formatMoney(net)],
              ]}
            />
          </div>
          <PrimaryButton disabled={quote.expired} onClick={() => setStage("pin")}>
            CONFIRMER LE RETRAIT
          </PrimaryButton>
        </Sheet>
      )}
      {stage === "pin" && <PinPrompt onClose={() => setStage("form")} onSuccess={execute} />}
    </div>
  );
}
