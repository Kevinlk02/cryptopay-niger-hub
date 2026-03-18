import { useState } from "react";
import { ArrowLeft, QrCode, Clipboard, Users } from "lucide-react";
import { RATES, PORTFOLIO, formatNumber } from "@/lib/data";

const platforms = ["Binance", "OKX", "Mon Wallet", "Autre"];

interface SendScreenProps {
  onBack: () => void;
}

export default function SendScreen({ onBack }: SendScreenProps) {
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const rate = RATES[selectedAsset] || 1;
  const fcfaValue = Math.round(numAmount * rate);
  const fee = 0.00005;
  const total = numAmount + fee;
  const canSend = address.length > 0 && numAmount > 0;

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4 relative">
      {/* Top Nav */}
      <div className="flex items-center">
        <button onClick={onBack} className="press-scale w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <span className="font-urbanist font-extrabold text-card-dark text-base flex-1 text-center">Envoyer</span>
        <button onClick={() => setShowAssetPicker(true)} className="press-scale bg-yellow px-3 py-1.5 rounded-full font-urbanist font-bold text-card-dark text-sm">
          {selectedAsset} ▾
        </button>
      </div>

      {/* Recipient */}
      <div className="bg-card-dark rounded-2xl p-4">
        <div className="font-urbanist font-semibold text-text-gray text-[10px] uppercase tracking-wider mb-2">Destinataire</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Adresse BTC ou nom"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 bg-transparent text-white font-urbanist font-medium text-sm placeholder:text-text-gray outline-none"
          />
          <div className="flex gap-1.5">
            {[QrCode, Clipboard, Users].map((Icon, i) => (
              <button key={i} className="press-scale w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <Icon size={14} className="text-white" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-white rounded-2xl p-4 text-center relative">
        <button className="absolute top-3 right-3 bg-yellow text-card-dark font-urbanist font-bold text-[11px] px-2.5 py-0.5 rounded-full press-scale">MAX</button>
        <input
          type="text"
          value={amount || "0.000"}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          className="font-urbanist font-black text-card-dark text-4xl text-center bg-transparent outline-none w-full"
          placeholder="0.000"
        />
        <div className="font-urbanist font-semibold text-card-dark text-4xl inline"> {selectedAsset}</div>
        <div className="font-urbanist font-normal text-text-gray text-[13px] mt-1">= {formatNumber(fcfaValue)} FCFA</div>
      </div>

      {/* Platform Shortcuts */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPlatform(p)}
            className={`press-scale px-4 py-2 rounded-full font-urbanist font-semibold text-sm whitespace-nowrap transition-all ${selectedPlatform === p ? "bg-yellow text-card-dark" : "bg-card-dark text-white"}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Network Fee */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-urbanist font-normal text-text-gray text-xs">Frais de réseau estimés</span>
          <span className="text-text-gray text-xs">ⓘ</span>
        </div>
        <span className="font-urbanist font-semibold text-card-dark text-[13px]">{fee} {selectedAsset}</span>
      </div>

      {/* Summary */}
      <div className="bg-card-dark rounded-2xl p-4 space-y-3">
        {[
          ["De", "Portefeuille Principal"],
          ["Vers", address || "——"],
          ["Montant", `${numAmount || 0} ${selectedAsset}`],
          ["Frais", `${fee} ${selectedAsset}`],
          ["Total", `${total.toFixed(5)} ${selectedAsset}`],
        ].map(([label, value], i) => (
          <div key={label} className="flex justify-between">
            <span className="font-urbanist font-medium text-text-gray text-sm">{label}</span>
            <span className={`font-urbanist font-semibold text-sm ${i === 4 ? "text-yellow font-bold" : "text-white"}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        className={`press-scale w-full h-[52px] rounded-full bg-yellow font-urbanist font-extrabold text-card-dark text-base ${!canSend ? "opacity-40 cursor-not-allowed" : ""}`}
        disabled={!canSend}
      >
        ENVOYER MAINTENANT
      </button>

      {/* Asset Picker Bottom Sheet */}
      {showAssetPicker && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center" onClick={() => setShowAssetPicker(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="slide-up relative w-full max-w-[390px] bg-card-dark rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#444] mx-auto mb-5" />
            <div className="space-y-2">
              {PORTFOLIO.assets.map((a) => (
                <button
                  key={a.symbol}
                  onClick={() => { setSelectedAsset(a.symbol); setShowAssetPicker(false); }}
                  className="press-scale w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#2A2A2A]"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: a.color }}>
                    <span className="font-urbanist font-black text-white text-sm">{a.symbol[0]}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-urbanist font-bold text-white text-sm">{a.name}</div>
                    <div className="font-urbanist font-normal text-text-gray text-[11px]">{a.amount} {a.symbol}</div>
                  </div>
                  {selectedAsset === a.symbol && <span className="text-yellow text-lg">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
