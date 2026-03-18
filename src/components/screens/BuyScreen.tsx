import { useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { RATES, formatNumber } from "@/lib/data";

const cryptos = ["BTC", "ETH", "USDT", "USDC"] as const;

interface BuyScreenProps {
  onBack: () => void;
}

export default function BuyScreen({ onBack }: BuyScreenProps) {
  const [selected, setSelected] = useState<string>("BTC");
  const [amount, setAmount] = useState("0");
  const [payMethod, setPayMethod] = useState("moov");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const rate = RATES[selected] || 1;
  const cryptoAmount = numAmount / rate;
  const fee = numAmount * 0.015;

  const handleKey = (key: string) => {
    if (key === "del") {
      setAmount((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
    } else if (key === ".") {
      if (!amount.includes(".")) setAmount((prev) => prev + ".");
    } else {
      setAmount((prev) => (prev === "0" ? key : prev + key));
    }
  };

  const methods = [
    { id: "moov", name: "Moov Money", phone: "+227 90 00 00 00", color: "#FF6B00", initial: "M" },
    { id: "orange", name: "Orange Money", phone: "+227 80 00 00 00", color: "#FF6600", initial: "O" },
    { id: "nita", name: "My Nita", phone: "+227 70 00 00 00", color: "#0066FF", initial: "N" },
  ];

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-card-dark flex flex-col items-center justify-center z-[100]">
        <div className="w-24 h-24 rounded-full bg-yellow success-circle mb-6" />
        <div className="success-check flex flex-col items-center">
          <span className="text-white text-6xl mb-4">✓</span>
          <span className="font-urbanist font-extrabold text-white text-2xl">Transaction réussie !</span>
          <span className="font-urbanist font-semibold text-yellow text-lg mt-2">{formatNumber(numAmount)} FCFA</span>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-fade px-5 pb-24 pt-4 relative">
      {/* Top Nav */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="press-scale w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <span className="font-urbanist font-extrabold text-card-dark text-base flex-1 text-center">ACHETER</span>
        <div className="w-9" />
      </div>

      {/* Crypto Chips */}
      <div className="flex gap-2 mb-5">
        {cryptos.map((c) => (
          <button
            key={c}
            onClick={() => setSelected(c)}
            className={`press-scale px-4 py-2 rounded-full font-urbanist font-bold text-sm transition-all duration-150 ${selected === c ? "bg-yellow text-card-dark" : "bg-card-dark text-white"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Amount Display */}
      <div className="bg-card-dark rounded-2xl p-6 mb-5 text-center relative">
        <button className="absolute top-4 right-4 bg-yellow text-card-dark font-urbanist font-bold text-[11px] px-2.5 py-0.5 rounded-full press-scale"
          onClick={() => setAmount("100000")}>MAX</button>
        <div className="flex items-baseline justify-center gap-1">
          <span className="font-urbanist font-black text-white text-[56px] italic leading-none">{formatNumber(numAmount)}</span>
          <span className="blink-cursor w-0.5 h-12 bg-yellow inline-block" />
        </div>
        <div className="font-urbanist font-medium text-text-gray text-base mt-1">FCFA</div>
        <div className="font-urbanist font-semibold text-yellow text-sm mt-1">
          ≈ {cryptoAmount.toFixed(6)} {selected}
        </div>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className={`press-scale-strong h-[72px] rounded-2xl font-urbanist font-bold text-2xl flex items-center justify-center transition-all duration-80 ${key === "del" ? "bg-card-dark text-white" : "bg-white text-card-dark active:bg-yellow/20"}`}
          >
            {key === "del" ? <ArrowLeft size={24} /> : key}
          </button>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="mb-4">
        <span className="font-urbanist font-bold text-card-dark text-sm mb-3 block">Moyen de paiement</span>
        <div className="space-y-3">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setPayMethod(m.id)}
              className={`press-scale w-full bg-white rounded-xl p-4 flex items-center gap-3 transition-all ${payMethod === m.id ? "border-l-4 border-yellow" : ""}`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: m.color }}>
                <span className="font-urbanist font-black text-white text-sm">{m.initial}</span>
              </div>
              <div className="text-left flex-1">
                <div className="font-urbanist font-bold text-card-dark text-sm">{m.name}</div>
                <div className="font-urbanist font-normal text-text-gray text-[11px]">{m.phone}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payMethod === m.id ? "border-yellow" : "border-card-dark"}`}>
                {payMethod === m.id && <div className="w-3 h-3 rounded-full bg-yellow" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fee */}
      <div className="text-center mb-4">
        <span className="font-urbanist font-normal text-text-gray text-xs">
          Frais de transaction : 1.5% = {formatNumber(Math.round(fee))} FCFA
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={() => numAmount > 0 && setShowConfirm(true)}
        className={`press-scale w-full h-[52px] rounded-full bg-yellow font-urbanist font-extrabold text-card-dark text-base ${numAmount === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
        disabled={numAmount === 0}
      >
        CONTINUER →
      </button>

      {/* Confirmation Bottom Sheet */}
      {showConfirm && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="slide-up relative w-full max-w-[390px] bg-card-dark rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#444] mx-auto mb-5" />
            <div className="space-y-3 mb-6">
              {[
                ["De", methods.find((m) => m.id === payMethod)?.name || ""],
                ["Vers", `Portefeuille ${selected}`],
                ["Montant", `${formatNumber(numAmount)} FCFA`],
                ["Frais", `${formatNumber(Math.round(fee))} FCFA`],
                ["Total", `${formatNumber(Math.round(numAmount + fee))} FCFA`],
              ].map(([label, value], i) => (
                <div key={label} className="flex justify-between">
                  <span className="font-urbanist font-medium text-text-gray text-sm">{label}</span>
                  <span className={`font-urbanist font-semibold text-sm ${i === 4 ? "text-yellow" : "text-white"}`}>{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowConfirm(false);
                setShowSuccess(true);
                setTimeout(() => {
                  setShowSuccess(false);
                  onBack();
                }, 2500);
              }}
              className="press-scale w-full h-[52px] rounded-full bg-yellow font-urbanist font-extrabold text-card-dark text-base"
            >
              CONFIRMER LE PAIEMENT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
