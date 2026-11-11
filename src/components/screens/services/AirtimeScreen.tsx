import { useState } from "react";
import { ASSETS, type AssetSymbol } from "@/lib/assets";
import { AIRTIME, COUNTRIES, COUNTRY_MAP, formatIntlPhone, formatNationalNumber, type CountryCode } from "@/lib/config";
import { formatCrypto, formatMoney, formatNumber } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { usePrices } from "@/hooks/usePrices";
import { Chip, InfoNote, PinPrompt, PrimaryButton, Sheet, SuccessOverlay, SummaryRows, TopBar } from "@/components/kit";

/** Recharge de crédit téléphonique payée en crypto, pour tout numéro UEMOA. */
export default function AirtimeScreen() {
  const { state, addTransaction, adjustHolding } = useApp();
  const { back, go } = useNav();
  const { prices } = usePrices();
  const user = state.user!;
  const ownDigits = user.phone.replace(/\D/g, "").slice(COUNTRY_MAP[user.country].dial.length);
  const held = ASSETS.filter((a) => (state.holdings[a.symbol] ?? 0) > 0);
  const [country, setCountry] = useState<CountryCode>(user.country);
  const [digits, setDigits] = useState(ownDigits);
  const [amount, setAmount] = useState(1_000);
  const [asset, setAsset] = useState<AssetSymbol>(held.find((a) => a.stable)?.symbol ?? held[0]?.symbol ?? "USDT");
  const [stage, setStage] = useState<"form" | "confirm" | "pin" | "success">("form");

  const c = COUNTRY_MAP[country];
  const validNumber = c.pattern.test(digits);
  const fee = Math.round(amount * AIRTIME.fee);
  const totalFCFA = amount + fee;
  const cryptoCost = totalFCFA / prices[asset].sellFCFA;
  const balance = state.holdings[asset] ?? 0;
  const insufficient = cryptoCost > balance;
  const ok = validNumber && amount >= AIRTIME.min && amount <= AIRTIME.max && !insufficient && held.length > 0;
  const phone = formatIntlPhone(country, digits);

  const execute = () => {
    adjustHolding(asset, -cryptoCost);
    addTransaction({ type: "airtime", asset, amount: cryptoCost, fcfa: amount, feeFCFA: fee, counterparty: phone, countsForLimits: true });
    setStage("success");
  };

  if (stage === "success") {
    return <SuccessOverlay title="Recharge envoyée !" subtitle={formatMoney(amount)} detail={`Crédit livré sur le ${phone}`} onDone={() => go({ name: "home" })} />;
  }

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Recharge mobile" onBack={back} />

      <div className="bg-card-dark rounded-[20px] p-4">
        <div className="font-urbanist font-semibold text-text-gray text-[10px] uppercase tracking-wider mb-2">Numéro à recharger</div>
        <div className="flex items-center gap-2">
          <select
            value={country}
            aria-label="Pays"
            onChange={(e) => {
              setCountry(e.target.value as CountryCode);
              setDigits("");
            }}
            className="bg-transparent text-white font-urbanist font-bold outline-none"
          >
            {COUNTRIES.map((k) => (
              <option key={k.code} value={k.code} className="text-card-dark">
                {k.code} +{k.dial}
              </option>
            ))}
          </select>
          <input
            inputMode="numeric"
            aria-label="Numéro"
            value={formatNationalNumber(digits, c.digits)}
            onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, c.digits))}
            placeholder={c.example}
            className="flex-1 min-w-0 bg-transparent outline-none font-urbanist font-bold text-white text-lg placeholder:text-[#666]"
          />
        </div>
        <div className="flex gap-3 mt-2">
          {digits !== ownDigits && country === user.country && (
            <button onClick={() => setDigits(ownDigits)} className="font-urbanist text-yellow text-xs press-scale">
              Mon numéro
            </button>
          )}
          <span className="font-urbanist text-text-gray text-[11px]">Opérateur détecté automatiquement</span>
        </div>
      </div>

      <div>
        <span className="font-urbanist font-bold text-card-dark text-sm mb-3 block">Montant</span>
        <div className="flex gap-2 flex-wrap">
          {AIRTIME.presets.map((p) => (
            <Chip key={p} active={amount === p} onClick={() => setAmount(p)}>
              {formatNumber(p)}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <span className="font-urbanist font-bold text-card-dark text-sm mb-3 block">Payer avec</span>
        {held.length === 0 ? (
          <InfoNote>Aucun actif disponible. Achetez d'abord de l'USDT.</InfoNote>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {held.map((a) => (
              <Chip key={a.symbol} active={asset === a.symbol} onClick={() => setAsset(a.symbol)}>
                {a.symbol}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[20px] p-4 space-y-1.5">
        <div className="flex justify-between font-urbanist text-xs">
          <span className="text-text-gray">Crédit</span>
          <span className="text-card-dark font-semibold">{formatMoney(amount)}</span>
        </div>
        <div className="flex justify-between font-urbanist text-xs">
          <span className="text-text-gray">Frais (1 %)</span>
          <span className="text-card-dark font-semibold">{formatMoney(fee)}</span>
        </div>
        <div className="flex justify-between font-urbanist text-sm pt-1.5 border-t border-border-sand">
          <span className="text-card-dark font-bold">Coût</span>
          <span className="text-card-dark font-extrabold">{formatCrypto(cryptoCost, asset)}</span>
        </div>
      </div>
      {insufficient && held.length > 0 && <InfoNote tone="red">Solde {asset} insuffisant.</InfoNote>}

      <PrimaryButton disabled={!ok} onClick={() => setStage("confirm")}>
        RECHARGER
      </PrimaryButton>
      <p className="font-urbanist text-text-gray text-[10px] text-center">Démo : recharge simulée. Nécessite un agrégateur de recharges partenaire.</p>

      {stage === "confirm" && (
        <Sheet onClose={() => setStage("form")} title="Confirmer la recharge">
          <div className="mb-5">
            <SummaryRows
              rows={[
                ["Numéro", phone],
                ["Crédit", formatMoney(amount)],
                ["Payé avec", formatCrypto(cryptoCost, asset)],
                ["Total", formatMoney(totalFCFA)],
              ]}
            />
          </div>
          <PrimaryButton onClick={() => setStage("pin")}>CONFIRMER</PrimaryButton>
        </Sheet>
      )}
      {stage === "pin" && <PinPrompt onClose={() => setStage("form")} onSuccess={execute} />}
    </div>
  );
}
