import type { Candle } from "@/lib/binance";
import { formatNumber } from "@/lib/format";
import { USD_TO_FCFA } from "@/lib/config";

const GAIN = "#4CAF50";
const LOSS = "#EF4444";

export function Sparkline({ values, width = 48, height = 24, color }: { values: number[]; width?: number; height?: number; color?: string }) {
  if (values.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stroke = color ?? (values[values.length - 1] >= values[0] ? GAIN : LOSS);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / range) * (height - 4)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" points={pts} />
    </svg>
  );
}

/** Mini-graphique à barres (liste Marché, CDC 4.6) */
export function MiniBars({ candles, width = 56, height = 28 }: { candles: Candle[] | undefined; width?: number; height?: number }) {
  if (!candles || candles.length === 0) {
    return (
      <svg width={width} height={height} aria-hidden>
        {Array.from({ length: 7 }).map((_, i) => (
          <rect key={i} x={i * (width / 7) + 2} y={height / 2} width={width / 7 - 4} height={2} rx={1} fill="#3A3A3A" />
        ))}
      </svg>
    );
  }
  const data = candles.slice(-7);
  const max = Math.max(...data.map((c) => c.h));
  const min = Math.min(...data.map((c) => c.l));
  const range = max - min || 1;
  const bw = width / data.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {data.map((c, i) => {
        const top = height - ((Math.max(c.o, c.c) - min) / range) * height;
        const bottom = height - ((Math.min(c.o, c.c) - min) / range) * height;
        return <rect key={i} x={i * bw + 1.5} y={top} width={bw - 3} height={Math.max(2, bottom - top)} rx={1} fill={c.c >= c.o ? GAIN : LOSS} opacity={0.9} />;
      })}
    </svg>
  );
}

/** Graphique chandelier (expansion inline Marché, CDC 4.6) */
export function CandleChart({ candles, height = 150 }: { candles: Candle[]; height?: number }) {
  const width = 300;
  const padR = 52;
  const plotW = width - padR;
  const max = Math.max(...candles.map((c) => c.h));
  const min = Math.min(...candles.map((c) => c.l));
  const range = max - min || 1;
  const y = (v: number) => 6 + (1 - (v - min) / range) * (height - 12);
  const step = plotW / candles.length;
  const bodyW = Math.max(1.5, step * 0.6);
  const last = candles[candles.length - 1];
  const fmt = (usd: number) => {
    const f = usd * USD_TO_FCFA;
    return f >= 1e6 ? `${formatNumber(f / 1e6, 2)}M` : f >= 1e3 ? `${formatNumber(f / 1e3, 1)}k` : formatNumber(f, 1);
  };
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Graphique chandelier en FCFA">
      {[max, (max + min) / 2, min].map((v, i) => (
        <g key={i}>
          <line x1={0} x2={plotW} y1={y(v)} y2={y(v)} stroke="#2A2A2A" strokeWidth={1} />
          <text x={width - 2} y={y(v) + 3} textAnchor="end" fill="#888" fontSize={9} fontFamily="Urbanist">
            {fmt(v)}
          </text>
        </g>
      ))}
      {candles.map((c, i) => {
        const x = i * step + step / 2;
        const color = c.c >= c.o ? GAIN : LOSS;
        const top = y(Math.max(c.o, c.c));
        const bottom = y(Math.min(c.o, c.c));
        return (
          <g key={c.t}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth={1} />
            <rect x={x - bodyW / 2} y={top} width={bodyW} height={Math.max(1, bottom - top)} fill={color} rx={0.5} />
          </g>
        );
      })}
      <line x1={0} x2={plotW} y1={y(last.c)} y2={y(last.c)} stroke="#F5E642" strokeWidth={1} strokeDasharray="4 3" />
    </svg>
  );
}
