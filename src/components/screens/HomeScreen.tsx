import { useState } from "react";
import { Eye, EyeOff, ShoppingCart, ArrowUp, ArrowDown, ClipboardList } from "lucide-react";
import { MOCK_USER, PORTFOLIO, MARKET, formatNumber } from "@/lib/data";
import logo from "@/assets/logo.png";

const quickActions = [
  { icon: ShoppingCart, label: "Acheter", action: "buy" },
  { icon: ArrowUp, label: "Envoyer", action: "send" },
  { icon: ArrowDown, label: "Recevoir", action: "receive" },
  { icon: ClipboardList, label: "Historique", action: "history" },
];

const sparkData: Record<string, number[]> = {
  BTC: [30, 35, 28, 40, 38],
  ETH: [20, 22, 18, 25, 23],
  USDT: [1, 1, 1, 1, 1],
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [balanceVisible, setBalanceVisible] = useState(true);

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="CryptoPay" className="h-7 w-7 rounded-lg" />
          <span className="font-urbanist font-bold text-card-dark text-lg">CryptoPay</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center">
            <span className="font-urbanist font-extrabold text-card-dark text-xs">{MOCK_USER.initials}</span>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-card-dark rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-urbanist font-medium text-text-gray text-xs">Portefeuille total</span>
          <div className="flex items-center gap-2">
            <span className="bg-yellow text-card-dark font-urbanist font-bold text-[10px] px-2.5 py-0.5 rounded-full">
              {PORTFOLIO.change} AUJOURD'HUI
            </span>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="press-scale w-7 h-7 rounded-full bg-[#2A2A2A] flex items-center justify-center">
              {balanceVisible ? <Eye size={14} className="text-white" /> : <EyeOff size={14} className="text-white" />}
            </button>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-urbanist font-black text-white text-5xl italic">
            {balanceVisible ? formatNumber(PORTFOLIO.totalFCFA) : "••• •••"}
          </span>
          <span className="font-urbanist font-semibold text-white text-xl">FCFA</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-urbanist font-extrabold text-card-dark text-sm">Actions rapides</span>
          <span className="font-urbanist font-medium text-text-gray text-xs">Tout voir</span>
        </div>
        <div className="flex justify-between">
          {quickActions.map((qa) => (
            <button
              key={qa.action}
              onClick={() => {
                if (qa.action === "buy") onNavigate("buy");
                else if (qa.action === "send") onNavigate("send");
                else if (qa.action === "receive") onNavigate("receive");
                else if (qa.action === "history") onNavigate("wallet");
              }}
              className="press-scale flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-full bg-card-dark flex items-center justify-center group-active:bg-yellow transition-colors duration-100">
                <qa.icon size={20} className="text-white group-active:text-card-dark" />
              </div>
              <span className="font-urbanist font-semibold text-card-dark text-[11px]">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Marché Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-urbanist font-extrabold text-card-dark text-sm">Marché</span>
          <button onClick={() => onNavigate("market")} className="font-urbanist font-medium text-text-gray text-xs press-scale">Tout voir</button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          {MARKET.slice(0, 4).map((m) => (
            <div key={m.symbol} className="min-w-[150px] bg-card-dark rounded-2xl p-3 press-scale">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: m.color }}>
                    <span className="font-urbanist font-black text-white text-[8px]">{m.symbol[0]}</span>
                  </div>
                  <span className="font-urbanist font-bold text-white text-[13px]">{m.symbol}</span>
                </div>
                <span className={`font-urbanist font-bold text-[10px] px-1.5 py-0.5 rounded-full ${m.change >= 0 ? "bg-yellow text-card-dark" : "bg-loss text-white"}`}>
                  {m.change >= 0 ? "+" : ""}{m.change}%
                </span>
              </div>
              <div className="font-urbanist font-extrabold text-white text-base">{formatNumber(m.priceFCFA)}</div>
              <div className="font-urbanist text-text-gray text-[11px]">FCFA</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actifs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-urbanist font-extrabold text-card-dark text-sm">Actifs</span>
          <span className="font-urbanist font-medium text-text-gray text-xs">Tout voir</span>
        </div>
        <div className="space-y-3">
          {PORTFOLIO.assets.map((a) => (
            <div key={a.symbol} className="bg-white rounded-xl p-4 flex items-center justify-between press-scale">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: a.color }}>
                  <span className="font-urbanist font-black text-white text-sm">{a.symbol[0]}</span>
                </div>
                <div>
                  <div className="font-urbanist font-bold text-card-dark text-sm">{a.name}</div>
                  <div className="font-urbanist font-normal text-text-gray text-[11px]">{a.network}</div>
                </div>
              </div>
              <MiniSparkline data={sparkData[a.symbol] || [1, 1, 1]} color={a.valueFCFA > 0 ? "#4CAF50" : "#888"} />
              <div className="text-right">
                <div className="font-urbanist font-bold text-card-dark text-sm">{a.amount} {a.symbol}</div>
                <div className="font-urbanist font-normal text-text-gray text-[11px]">{formatNumber(a.valueFCFA)} FCFA</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
