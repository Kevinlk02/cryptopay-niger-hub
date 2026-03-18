import { useState } from "react";
import { Search, Bell } from "lucide-react";
import { MARKET, formatNumber } from "@/lib/data";

const filters = ["Favoris", "Tendances", "Stablecoins"];

function MiniCandlestick({ positive }: { positive: boolean }) {
  const color = positive ? "#4CAF50" : "#EF4444";
  return (
    <svg width={60} height={30} viewBox="0 0 60 30">
      {[0, 1, 2, 3, 4].map((i) => {
        const x = i * 12 + 6;
        const h = 8 + Math.random() * 14;
        const y = positive ? 30 - h - Math.random() * 5 : 2 + Math.random() * 5;
        return <rect key={i} x={x - 2} y={y} width={4} rx={1} height={h} fill={color} opacity={0.8} />;
      })}
    </svg>
  );
}

export default function MarketScreen() {
  const [activeFilter, setActiveFilter] = useState("Tendances");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState("1S");

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <span className="font-urbanist font-black text-card-dark text-2xl">MARCHÉ</span>
        <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center press-scale">
          <Bell size={18} className="text-white" />
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-full h-11 flex items-center px-4 gap-2">
        <Search size={18} className="text-text-gray" />
        <span className="font-urbanist font-normal text-text-gray text-sm">Rechercher des crypto-actifs</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`press-scale px-4 py-2 rounded-full font-urbanist font-bold text-sm transition-all duration-150 ${activeFilter === f ? "bg-yellow text-card-dark" : "bg-card-dark text-white"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Asset List */}
      <div className="bg-card-dark rounded-2xl overflow-hidden">
        {MARKET.map((m, idx) => (
          <div key={m.symbol}>
            <button
              onClick={() => setExpandedRow(expandedRow === m.symbol ? null : m.symbol)}
              className="press-scale w-full p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: m.color }}>
                <span className="font-urbanist font-black text-white text-sm">{m.symbol[0]}</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-urbanist font-bold text-white text-sm">{m.name}</div>
                <div className="font-urbanist font-normal text-text-gray text-[11px]">Vol. {m.vol}</div>
              </div>
              <MiniCandlestick positive={m.change >= 0} />
              <div className="text-right shrink-0">
                <div className="font-urbanist font-extrabold text-white text-[15px]">${m.priceUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                <span className={`font-urbanist font-bold text-[10px] px-1.5 py-0.5 rounded-full inline-block ${m.change >= 0 ? "bg-yellow text-card-dark" : "bg-loss text-white"}`}>
                  {m.change >= 0 ? "+" : ""}{m.change}%
                </span>
              </div>
            </button>

            {/* Expanded Chart */}
            {expandedRow === m.symbol && (
              <div className="px-4 pb-4">
                <div className="bg-[#111] rounded-xl h-[120px] flex items-center justify-center mb-3">
                  <svg width="100%" height="80" viewBox="0 0 280 80">
                    <polyline fill="none" stroke={m.change >= 0 ? "#4CAF50" : "#EF4444"} strokeWidth="2"
                      points="0,60 30,50 60,55 90,40 120,45 150,30 180,35 210,25 240,30 270,20" />
                    <line x1="0" y1="30" x2="280" y2="30" stroke="#F5E642" strokeWidth="1" strokeDasharray="4" />
                  </svg>
                </div>
                <div className="flex gap-2">
                  {["1J", "1S", "1M", "1A"].map((t) => (
                    <button
                      key={t}
                      onClick={(e) => { e.stopPropagation(); setTimeFilter(t); }}
                      className={`press-scale px-3 py-1 rounded-full font-urbanist font-bold text-xs ${timeFilter === t ? "bg-yellow text-card-dark" : "bg-[#2A2A2A] text-white"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {idx < MARKET.length - 1 && <div className="h-px bg-[#2A2A2A] mx-4" />}
          </div>
        ))}
      </div>
    </div>
  );
}
