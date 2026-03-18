import { useState } from "react";
import { Copy, Share2 } from "lucide-react";

interface ReceiveModalProps {
  onClose: () => void;
}

const cryptos = ["BTC", "ETH", "USDT", "USDC"];

export default function ReceiveModal({ onClose }: ReceiveModalProps) {
  const [selected, setSelected] = useState("BTC");
  const address = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="slide-up relative w-full max-w-[390px] bg-card-dark rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-[#444] mx-auto mb-5" />
        
        <div className="text-center mb-4">
          <span className="font-urbanist font-extrabold text-white text-lg">Recevoir</span>
        </div>

        {/* Asset chips */}
        <div className="flex gap-2 justify-center mb-5">
          {cryptos.map((c) => (
            <button
              key={c}
              onClick={() => setSelected(c)}
              className={`press-scale px-4 py-2 rounded-full font-urbanist font-bold text-sm ${selected === c ? "bg-yellow text-card-dark" : "bg-[#2A2A2A] text-white"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* QR Placeholder */}
        <div className="w-[200px] h-[200px] mx-auto bg-white rounded-2xl flex items-center justify-center mb-4">
          <div className="grid grid-cols-8 gap-[2px]">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className={`w-4 h-4 ${Math.random() > 0.5 ? "bg-card-dark" : "bg-white"}`} />
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="font-urbanist font-semibold text-white text-[13px] text-center mb-4 break-all px-4">
          {address.slice(0, 12)}...{address.slice(-6)}
        </div>

        {/* Warning */}
        <div className="bg-yellow/10 rounded-xl p-3 mb-4 text-center">
          <span className="font-urbanist font-medium text-yellow text-xs">⚠ Envoyez uniquement du {selected} sur ce réseau</span>
        </div>

        {/* Buttons */}
        <button className="press-scale w-full h-[52px] rounded-full bg-yellow font-urbanist font-extrabold text-card-dark text-base mb-3 flex items-center justify-center gap-2">
          <Copy size={18} /> Copier l'adresse
        </button>
        <button className="press-scale w-full h-[52px] rounded-full bg-[#2A2A2A] font-urbanist font-extrabold text-white text-base flex items-center justify-center gap-2">
          <Share2 size={18} /> Partager mon adresse
        </button>
      </div>
    </div>
  );
}
