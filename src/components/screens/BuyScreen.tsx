import { useEffect, useRef, useState } from "react";
import { Check, Loader2, QrCode, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ASSET_MAP, BUYABLE, NETWORKS, validateAddress, type AssetSymbol, type NetworkId } from "@/lib/assets";
import { FEES, PISPI } from "@/lib/config";
import { formatCrypto, formatMoney, formatNumber } from "@/lib/format";
import { uid, useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { usePrices } from "@/hooks/usePrices";
import { Chip, InfoNote, Numpad, PinPrompt, PrimaryButton, QuoteBadge, Sheet, SuccessOverlay, SummaryRows, TopBar, applyNumpadKey } from "@/components/kit";
import { useLockedQuote } from "@/hooks/useLockedQuote";
import { PayAccountList } from "@/components/kit/PayAccounts";

const MIN_AMOUNT = 500;

/** Statuts d'une demande de paiement PI-SPI (API Business) */
const STEPS = [
  { id: "INITIE", label: "Demande créée" },
  { id: "ENVOYE", label: "Reçue par votre établissement" },
  { id: "IRREVOCABLE", label: "Paiement confirmé" },
] as const;

function PendingPayment({ total, institution, alias, onPaid, onCancel }: { total: number; institution: string; alias: string; onPaid: () => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [showQr, setShowQr] = useState(false);
  const [left, setLeft] = useState(PISPI.requestTimeoutSec);
  const [txId] = useState(() => uid().toUpperCase());

  // Simulation : en production, le statut arrive par webhook signé du participant
  // partenaire, avec relecture périodique (GET) en cas de webhook perdu.
  const paidRef = useRef(onPaid);
  paidRef.current = onPaid;
  useEffect(() => {
    const timers = [setTimeout(() => setStep(1), 900), setTimeout(() => setStep(2), 3600), setTimeout(() => paidRef.current(), 4600)];
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
    };
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(1, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 bg-card-dark flex flex-col items-center justify-center z-[110] px-8 text-center">
      {showQr ? (
        <div className="bg-white rounded-[20px] p-3 mb-5">
          <QRCodeSVG value={`pispi://pay?ref=${txId}&amount=${total}&currency=XOF`} size={180} fgColor="#1A1A1A" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-6 pulse-ring">
          <Smartphone size={34} className="text-yellow" />
        </div>
      )}
      <h2 className="font-urbanist font-extrabold text-white text-xl mb-2">{showQr ? "Scannez avec votre app bancaire" : "Validez dans votre application"}</h2>
      <p className="font-urbanist text-text-gray text-sm max-w-[290px]">
        {showQr ? (
          <>Ouvrez l'application de n'importe quel établissement PI-SPI et scannez ce code pour payer <b className="text-white">{formatMoney(total)}</b>.</>
        ) : (
          <>
            Demande de paiement PI-SPI de <b className="text-white">{formatMoney(total)}</b> envoyée à <b className="text-white">{institution}</b> ({alias}). Confirmez-la dans l'application de votre établissement.
          </>
        )}
      </p>

      <div className="w-full max-w-[280px] mt-6 space-y-2 text-left">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i < step || (i === 2 && step === 2) ? "bg-yellow" : "bg-[#2A2A2A]"}`}>
              {i < step || (i === 2 && step === 2) ? <Check size={13} className="text-card-dark" strokeWidth={3} /> : i === step ? <Loader2 size={13} className="text-yellow animate-spin" /> : null}
            </div>
            <span className={`font-urbanist text-sm ${i <= step ? "text-white font-semibold" : "text-[#666]"}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <p className="font-urbanist text-text-gray text-xs mt-6">
        Expire dans {mm}:{ss} · réf. {txId.slice(0, 10)}
      </p>
      <div className="flex gap-3 mt-5">
        <button onClick={() => setShowQr(!showQr)} className="press-scale h-10 px-4 rounded-full bg-[#2A2A2A] text-white font-urbanist font-bold text-xs flex items-center gap-1.5">
          <QrCode size={14} /> {showQr ? "Demande sur mon téléphone" : "Payer par QR code"}
        </button>
        <button onClick={onCancel} className="press-scale h-10 px-4 rounded-full bg-[#2A2A2A] text-loss font-urbanist font-bold text-xs">
          Annuler
        </button>
      </div>
      <p className="font-urbanist text-[#666] text-[11px] mt-6">Démo : paiement PI-SPI simulé, aucun débit réel.</p>
    </div>
  );
}

export default function BuyScreen({ initialAsset, initialAmount }: { initialAsset?: AssetSymbol; initialAmount?: number }) {
  const { state, t, addTransaction, adjustHolding, remainingAllowance } = useApp();
  const { back, go } = useNav();
  const { prices, source } = usePrices();
  const user = state.user!;
  const [selected, setSelected] = useState<AssetSymbol>(initialAsset && BUYABLE.includes(initialAsset) ? initialAsset : "BTC");
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : "0");
  const [accountId, setAccountId] = useState<string | undefined>(user.payAccounts[0]?.id);
  const [stage, setStage] = useState<"form" | "confirm" | "pin" | "pending" | "success">("form");
  const [delivery, setDelivery] = useState<"wallet" | "external">("wallet");
  const [extNetwork, setExtNetwork] = useState<NetworkId>(ASSET_MAP[selected].networks[0].id);
  const [extAddress, setExtAddress] = useState("");

  const numAmount = Math.floor(parseFloat(amount) || 0);
  // Devis garanti : taux figé dès l'ouverture de la confirmation
  const quote = useLockedQuote(prices[selected].buyFCFA, stage !== "form" && stage !== "success");
  const rate = quote.rate;
  const grossCrypto = numAmount / rate;
  // Livraison directe vers une adresse externe : 0,5 % + frais réseau, déduits des cryptos reçues
  const extCheck = validateAddress(extAddress, extNetwork);
  const extValid = extCheck.ok && extCheck.kind === "external";
  const extFee = delivery === "external" ? grossCrypto * FEES.externalWithdraw + ASSET_MAP[selected].networks.find((n) => n.id === extNetwork)!.fee : 0;
  const cryptoAmount = Math.max(0, grossCrypto - extFee);
  const account = user.payAccounts.find((a) => a.id === accountId);
  const commission = Math.round(numAmount * FEES.buyCommission);
  const partnerFee = Math.round(numAmount * PISPI.partnerFee);
  const total = numAmount + commission + partnerFee;
  const overLimit = numAmount > remainingAllowance;
  const overPispi = total > PISPI.maxPerPayment;
  const tooSmall = numAmount > 0 && numAmount < MIN_AMOUNT;
  const canContinue = numAmount >= MIN_AMOUNT && !overLimit && !overPispi && !!account && (delivery === "wallet" || (extValid && cryptoAmount > 0));

  const credit = () => {
    addTransaction({
      type: "buy",
      asset: selected,
      amount: grossCrypto,
      fcfa: numAmount,
      feeFCFA: commission + partnerFee,
      counterparty: `PI-SPI · ${account!.institution}`,
      countsForLimits: true,
    });
    if (delivery === "external") {
      addTransaction({
        type: "send",
        asset: selected,
        amount: cryptoAmount,
        fcfa: Math.round(cryptoAmount * rate),
        feeFCFA: Math.round(extFee * rate),
        counterparty: extAddress.trim(),
        network: extNetwork,
        countsForLimits: false,
      });
    } else {
      adjustHolding(selected, cryptoAmount);
    }
    setStage("success");
  };

  if (stage === "success") {
    return <SuccessOverlay title="Achat réussi !" subtitle={`+${formatCrypto(cryptoAmount, selected)}`} detail={delivery === "external" ? `Livré sur ${NETWORKS[extNetwork].label} · ${extAddress.slice(0, 10)}…` : `${formatMoney(total)} payés via PI-SPI · ${account!.institution}`} onDone={() => go({ name: "home" })} />;
  }

  if (stage === "pending" && account) {
    return <PendingPayment total={total} institution={account.institution} alias={account.alias} onPaid={credit} onCancel={() => setStage("form")} />;
  }

  const maxAllowed = Math.min(Number.isFinite(remainingAllowance) ? remainingAllowance : PISPI.maxPerPayment, Math.floor(PISPI.maxPerPayment / (1 + FEES.buyCommission + PISPI.partnerFee)));

  return (
    <div className="screen-fade px-5 pb-24 pt-4 relative">
      <div className="mb-5">
        <TopBar title={t("buy.title")} onBack={back} />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {BUYABLE.map((c) => (
          <Chip
            key={c}
            active={selected === c}
            onClick={() => {
              setSelected(c);
              setExtNetwork(ASSET_MAP[c].networks[0].id);
            }}
          >
            {c}
          </Chip>
        ))}
      </div>

      <div className="bg-card-dark rounded-[20px] p-5 mb-4 text-center relative">
        <button className="absolute top-4 right-4 bg-yellow text-card-dark font-urbanist font-bold text-[11px] px-2.5 py-0.5 rounded-full press-scale" onClick={() => setAmount(String(maxAllowed))}>
          MAX
        </button>
        <div className="flex items-baseline justify-center gap-1 mt-2">
          <span className="font-urbanist font-black text-white text-[52px] italic leading-none">{formatNumber(numAmount)}</span>
          <span className="blink-cursor w-0.5 h-11 bg-yellow inline-block" />
        </div>
        <div className="font-urbanist font-medium text-text-gray text-base mt-1">FCFA</div>
        <div className="font-urbanist font-semibold text-yellow text-sm mt-1">≈ {formatCrypto(cryptoAmount, selected)}</div>
        <div className="font-urbanist text-[#666] text-[11px] mt-2">
          1 {selected} = {formatMoney(rate)} {source !== "live" && "· prix indicatif"}
        </div>
      </div>

      {overLimit && (
        <div className="mb-4">
          <InfoNote tone="red">
            Plafond KYC dépassé : il vous reste {formatMoney(Number.isFinite(remainingAllowance) ? remainingAllowance : 0)} disponibles.{" "}
            <button onClick={() => go({ name: "kyc" })} className="font-bold underline">
              Augmenter mon plafond
            </button>
          </InfoNote>
        </div>
      )}
      {overPispi && !overLimit && (
        <div className="mb-4">
          <InfoNote tone="red">PI-SPI limite un paiement vers un particulier à {formatMoney(PISPI.maxPerPayment)}. Fractionnez votre achat.</InfoNote>
        </div>
      )}
      {tooSmall && <p className="font-urbanist text-text-gray text-xs text-center mb-3">Montant minimum : {formatMoney(MIN_AMOUNT)}</p>}

      <div className="mb-5">
        <Numpad onKey={(k) => setAmount((p) => applyNumpadKey(p, k, 0))} allowDecimal={false} />
      </div>

      <div className="mb-4">
        <span className="font-urbanist font-bold text-card-dark text-sm mb-3 block">Recevoir sur</span>
        <div className="flex gap-2 mb-3">
          <Chip active={delivery === "wallet"} onClick={() => setDelivery("wallet")}>
            Mon wallet CryptoPay
          </Chip>
          <Chip active={delivery === "external"} onClick={() => setDelivery("external")}>
            Adresse externe
          </Chip>
        </div>
        {delivery === "external" && (
          <div className="bg-card-dark rounded-[20px] p-4">
            <div className="flex gap-2 mb-3 flex-wrap">
              {ASSET_MAP[selected].networks.map((n) => (
                <Chip key={n.id} onDark active={extNetwork === n.id} onClick={() => setExtNetwork(n.id)}>
                  {NETWORKS[n.id].label}
                </Chip>
              ))}
            </div>
            <input
              value={extAddress}
              onChange={(e) => setExtAddress(e.target.value.trim())}
              placeholder={`Adresse ${NETWORKS[extNetwork].label} (Binance, OKX, Trust Wallet…)`}
              spellCheck={false}
              className="w-full bg-transparent text-white font-urbanist text-sm placeholder:text-text-gray outline-none"
            />
            {extAddress && (
              <p className={`font-urbanist text-[11px] mt-2 font-semibold ${extValid ? "text-gain" : "text-loss"}`}>
                {extValid ? `Adresse ${NETWORKS[extNetwork].label} valide · frais ${formatCrypto(extFee, selected)}` : "reason" in extCheck ? extCheck.reason : "Envoi externe uniquement"}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-urbanist font-bold text-card-dark text-sm">{t("buy.method")}</span>
          <span className="font-urbanist font-bold text-[10px] bg-card-dark text-yellow px-2 py-0.5 rounded-full">PI-SPI · UEMOA</span>
        </div>
        <PayAccountList selectedId={accountId} onSelect={setAccountId} />
      </div>

      <div className="bg-white rounded-[20px] p-4 mb-4 space-y-1.5">
        {[
          ["Commission CryptoPay (1,5 %)", commission],
          ["Frais PI-SPI (partenaire)", partnerFee],
        ].map(([l, v]) => (
          <div key={l as string} className="flex justify-between font-urbanist text-xs">
            <span className="text-text-gray">{l}</span>
            <span className="text-card-dark font-semibold">{formatMoney(v as number)}</span>
          </div>
        ))}
        <div className="flex justify-between font-urbanist text-sm pt-1.5 border-t border-border-sand">
          <span className="text-card-dark font-bold">Total payé</span>
          <span className="text-card-dark font-extrabold">{formatMoney(total)}</span>
        </div>
      </div>

      <PrimaryButton disabled={!canContinue} onClick={() => setStage("confirm")}>
        {t("action.continue")}
      </PrimaryButton>

      {stage === "confirm" && account && (
        <Sheet onClose={() => setStage("form")} title="Confirmer l'achat">
          <QuoteBadge secondsLeft={quote.secondsLeft} expired={quote.expired} onRefresh={quote.refresh} />
          <div className="mb-5">
            <SummaryRows
              rows={[
                ["Payé depuis", `${account.institution} · ${account.alias}`],
                ["Via", "PI-SPI (BCEAO) · instantané"],
                ["Taux garanti", `1 ${selected} = ${formatMoney(rate)}`],
                ["Vers", delivery === "external" ? `${NETWORKS[extNetwork].label} · ${extAddress.slice(0, 10)}…${extAddress.slice(-6)}` : `Portefeuille ${ASSET_MAP[selected].name}`],
                ["Vous recevez", formatCrypto(cryptoAmount, selected)],
                ["Montant", formatMoney(numAmount)],
                ["Frais", formatMoney(commission + partnerFee)],
                ["Total", formatMoney(total)],
              ]}
            />
          </div>
          <p className="font-urbanist text-text-gray text-[11px] mb-5">
            Un paiement PI-SPI confirmé est irrévocable. Le montant affiché est exactement celui que vous recevrez tant que le devis est valide. Les crypto-actifs sont volatils.
          </p>
          <PrimaryButton disabled={quote.expired} onClick={() => setStage("pin")}>
            ENVOYER LA DEMANDE DE PAIEMENT
          </PrimaryButton>
        </Sheet>
      )}
      {stage === "pin" && <PinPrompt onClose={() => setStage("form")} onSuccess={() => setStage("pending")} />}
    </div>
  );
}
