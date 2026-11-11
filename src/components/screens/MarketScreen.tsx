import { useState } from "react";
import { Search, Bell, Star, X, Trash2 } from "lucide-react";
import { ASSETS, ASSET_MAP, type AssetSymbol } from "@/lib/assets";
import type { ChartRange } from "@/lib/binance";
import { formatCompactUSD, formatMoney, formatNumber, formatPercent, formatUSD } from "@/lib/format";
import { uid, useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { useCandles, usePrices } from "@/hooks/usePrices";
import { Chip, CoinIcon, NetworkBanner, PrimaryButton, Sheet } from "@/components/kit";
import { CandleChart, MiniBars } from "@/components/kit/charts";

const FILTERS = ["Tous", "Favoris", "Tendances", "Stablecoins"] as const;
type Filter = (typeof FILTERS)[number];

function RowBars({ symbol }: { symbol: AssetSymbol }) {
  const { data } = useCandles(symbol, "1S");
  return <MiniBars candles={data} />;
}

function ExpandedChart({ symbol, onAlert }: { symbol: AssetSymbol; onAlert: () => void }) {
  const [range, setRange] = useState<ChartRange>("1S");
  const { data, isLoading, isError } = useCandles(symbol, range);
  const { state } = useApp();
  const { go } = useNav();
  const hi = data ? Math.max(...data.map((c) => c.h)) : 0;
  const lo = data ? Math.min(...data.map((c) => c.l)) : 0;
  const perf = data && data.length > 1 ? ((data[data.length - 1].c - data[0].o) / data[0].o) * 100 : 0;
  return (
    <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-[#111] rounded-[16px] min-h-[150px] flex items-center justify-center mb-3 p-2">
        {state.dataSaver ? (
          <span className="font-urbanist text-text-gray text-xs text-center px-4">Graphiques désactivés en mode économie de données</span>
        ) : isLoading ? (
          <span className="font-urbanist text-text-gray text-xs">Chargement…</span>
        ) : isError || !data?.length ? (
          <span className="font-urbanist text-text-gray text-xs">Graphique indisponible hors ligne</span>
        ) : (
          <CandleChart candles={data} />
        )}
      </div>
      {data && data.length > 0 && (
        <div className="flex justify-between font-urbanist text-[11px] mb-3 px-1">
          <span className="text-text-gray">
            Haut <b className="text-white">{formatUSD(hi)}</b>
          </span>
          <span className="text-text-gray">
            Bas <b className="text-white">{formatUSD(lo)}</b>
          </span>
          <span className={perf >= 0 ? "text-gain font-bold" : "text-loss font-bold"}>{formatPercent(perf)}</span>
        </div>
      )}
      <div className="flex gap-2 mb-3">
        {(["1J", "1S", "1M", "1A"] as ChartRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`press-scale px-3 py-1 rounded-full font-urbanist font-bold text-xs ${range === r ? "bg-yellow text-card-dark" : "bg-[#2A2A2A] text-white"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {ASSET_MAP[symbol].buyable && (
          <button onClick={() => go({ name: "buy", asset: symbol })} className="press-scale flex-1 h-10 rounded-full bg-yellow font-urbanist font-extrabold text-card-dark text-sm">
            Acheter {symbol}
          </button>
        )}
        <button onClick={onAlert} className="press-scale flex-1 h-10 rounded-full bg-[#2A2A2A] font-urbanist font-bold text-white text-sm flex items-center justify-center gap-1.5">
          <Bell size={14} /> Alerte
        </button>
      </div>
    </div>
  );
}

function AlertsSheet({ onClose, preset }: { onClose: () => void; preset?: AssetSymbol }) {
  const { state, update } = useApp();
  const { prices } = usePrices();
  const [asset, setAsset] = useState<AssetSymbol>(preset ?? "BTC");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const current = prices[asset].fcfa;
  const [price, setPrice] = useState(String(Math.round(current * 1.05)));

  const add = () => {
    const v = parseFloat(price.replace(/\s/g, ""));
    if (!v) return;
    update((s) => ({ ...s, alerts: [...s.alerts, { id: uid(), asset, direction, priceFCFA: v }] }));
  };

  return (
    <Sheet onClose={onClose} title="Alertes de prix">
      {state.alerts.length > 0 && (
        <div className="space-y-2 mb-5">
          {state.alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 bg-[#2A2A2A] rounded-[16px] p-3">
              <CoinIcon symbol={a.asset} size={28} />
              <span className="flex-1 font-urbanist text-white text-sm">
                {a.direction === "above" ? "≥" : "≤"} {formatMoney(a.priceFCFA)}
              </span>
              <button aria-label="Supprimer" onClick={() => update((s) => ({ ...s, alerts: s.alerts.filter((x) => x.id !== a.id) }))} className="press-scale">
                <Trash2 size={16} className="text-text-gray" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {ASSETS.map((a) => (
          <Chip
            key={a.symbol}
            onDark
            active={asset === a.symbol}
            onClick={() => {
              setAsset(a.symbol);
              setPrice(String(Math.round(prices[a.symbol].fcfa * (direction === "above" ? 1.05 : 0.95))));
            }}
          >
            {a.symbol}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        {(["above", "below"] as const).map((d) => (
          <Chip key={d} onDark active={direction === d} onClick={() => setDirection(d)}>
            {d === "above" ? "Monte au-dessus" : "Descend sous"}
          </Chip>
        ))}
      </div>
      <div className="bg-[#2A2A2A] rounded-[16px] px-4 py-3 mb-2 flex items-center gap-2">
        <input
          inputMode="numeric"
          aria-label="Prix cible"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
          className="flex-1 bg-transparent outline-none font-urbanist font-bold text-white text-lg"
        />
        <span className="font-urbanist text-text-gray text-sm">FCFA</span>
      </div>
      <p className="font-urbanist text-text-gray text-[11px] mb-5">Cours actuel : {formatMoney(current)}</p>
      <PrimaryButton onClick={add}>CRÉER L'ALERTE</PrimaryButton>
      {!state.notifications.market && <p className="font-urbanist text-loss text-[11px] mt-3 text-center">Les notifications Marché sont désactivées dans votre profil.</p>}
    </Sheet>
  );
}

export default function MarketScreen() {
  const { state, update, t } = useApp();
  const { prices } = usePrices();
  const [filter, setFilter] = useState<Filter>("Tous");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<AssetSymbol | null>(null);
  const [alerts, setAlerts] = useState<{ preset?: AssetSymbol } | null>(null);

  const q = query.trim().toLowerCase();
  let list = ASSETS.filter((a) => !q || a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  if (filter === "Favoris") list = list.filter((a) => state.favorites.includes(a.symbol));
  if (filter === "Stablecoins") list = list.filter((a) => a.stable);
  if (filter === "Tendances") list = [...list].sort((a, b) => Math.abs(prices[b.symbol].change24h) - Math.abs(prices[a.symbol].change24h));

  const toggleFav = (s: AssetSymbol) =>
    update((st) => ({ ...st, favorites: st.favorites.includes(s) ? st.favorites.filter((f) => f !== s) : [...st.favorites, s] }));

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-urbanist font-black text-card-dark text-2xl">{t("market.title")}</span>
        <button onClick={() => setAlerts({})} aria-label="Alertes de prix" className="relative w-9 h-9 rounded-full bg-card-dark flex items-center justify-center press-scale">
          <Bell size={18} className="text-white" />
          {state.alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow font-urbanist font-black text-[9px] text-card-dark flex items-center justify-center">
              {state.alerts.length}
            </span>
          )}
        </button>
      </div>

      <NetworkBanner />

      <div className="bg-white rounded-full h-11 flex items-center px-4 gap-2">
        <Search size={18} className="text-text-gray shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("market.search")}
          aria-label={t("market.search")}
          className="flex-1 bg-transparent outline-none font-urbanist text-card-dark text-sm placeholder:text-text-gray"
        />
        {query && (
          <button aria-label="Effacer" onClick={() => setQuery("")}>
            <X size={16} className="text-text-gray" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>

      <div className="bg-card-dark rounded-[20px] overflow-hidden">
        {list.length === 0 && (
          <p className="font-urbanist text-text-gray text-sm text-center py-8">{filter === "Favoris" ? "Aucun favori. Touchez ☆ pour en ajouter." : "Aucun résultat"}</p>
        )}
        {list.map((a, idx) => {
          const p = prices[a.symbol];
          const fav = state.favorites.includes(a.symbol);
          return (
            <div key={a.symbol}>
              <div role="button" tabIndex={0} onClick={() => setExpanded(expanded === a.symbol ? null : a.symbol)} className="w-full p-4 flex items-center gap-3 cursor-pointer">
                <button
                  aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(a.symbol);
                  }}
                  className="press-scale -ml-1"
                >
                  <Star size={14} className={fav ? "text-yellow fill-yellow" : "text-[#555]"} />
                </button>
                <CoinIcon symbol={a.symbol} />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-urbanist font-bold text-white text-sm">{a.name}</div>
                  <div className="font-urbanist text-text-gray text-[11px]">Vol. {formatCompactUSD(p.volumeUSD)}</div>
                </div>
                <RowBars symbol={a.symbol} />
                <div className="text-right shrink-0 min-w-[92px]">
                  <div className="font-urbanist font-extrabold text-white text-[14px]">{formatNumber(p.fcfa, p.fcfa < 1000 ? 1 : 0)}</div>
                  <div className="font-urbanist text-text-gray text-[10px] mb-0.5">FCFA · {formatUSD(p.usd)}</div>
                  <span className={`font-urbanist font-bold text-[10px] px-1.5 py-0.5 rounded-full inline-block ${p.change24h >= 0 ? "bg-yellow text-card-dark" : "bg-loss text-white"}`}>
                    {formatPercent(p.change24h)}
                  </span>
                </div>
              </div>
              {expanded === a.symbol && <ExpandedChart symbol={a.symbol} onAlert={() => setAlerts({ preset: a.symbol })} />}
              {idx < list.length - 1 && <div className="h-px bg-[#2A2A2A] mx-4" />}
            </div>
          );
        })}
      </div>
      <p className="font-urbanist text-text-gray text-[10px] text-center">Cours Binance en temps réel · 1 USD = 600 FCFA</p>

      {alerts && <AlertsSheet preset={alerts.preset} onClose={() => setAlerts(null)} />}
    </div>
  );
}
