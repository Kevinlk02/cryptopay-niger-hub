import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Delete, Fingerprint, WifiOff, X } from "lucide-react";
import { ASSET_MAP, type AssetSymbol } from "@/lib/assets";
import { hashPin, useApp } from "@/store/AppStore";
import { usePrices } from "@/hooks/usePrices";

// ───────── Barre de titre ─────────
export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="flex items-center min-h-9">
      {onBack ? (
        <button onClick={onBack} aria-label="Retour" className="press-scale w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
          <ArrowLeft size={18} className="text-white" />
        </button>
      ) : (
        <div className="w-9" />
      )}
      <span className="font-urbanist font-extrabold text-card-dark text-base flex-1 text-center uppercase tracking-wide">{title}</span>
      <div className="min-w-9 flex justify-end">{right}</div>
    </div>
  );
}

// ───────── Icône crypto ─────────
export function CoinIcon({ symbol, size = 36 }: { symbol: AssetSymbol; size?: number }) {
  const a = ASSET_MAP[symbol];
  return (
    <div className="rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: a?.color ?? "#444", width: size, height: size }}>
      <span className="font-urbanist font-black text-white" style={{ fontSize: Math.max(8, size * 0.36) }}>
        {symbol === "USDT" ? "₮" : symbol === "BTC" ? "₿" : symbol === "ETH" ? "Ξ" : symbol[0]}
      </span>
    </div>
  );
}

// ───────── Toggle 44×24 (jaune / gris) ─────────
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${checked ? "bg-yellow" : "bg-[#CCCCCC]"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

// ───────── Chip pilule ─────────
export function Chip({ active, onClick, children, onDark }: { active: boolean; onClick: () => void; children: ReactNode; onDark?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`press-scale px-4 py-2 rounded-full font-urbanist font-bold text-sm whitespace-nowrap transition-all duration-150 ${
        active ? "bg-yellow text-card-dark" : onDark ? "bg-[#2A2A2A] text-white" : "bg-card-dark text-white"
      }`}
    >
      {children}
    </button>
  );
}

// ───────── Bouton principal ─────────
export function PrimaryButton({ children, onClick, disabled, variant = "yellow", className = "" }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "yellow" | "dark" | "ghost";
  className?: string;
}) {
  const styles = {
    yellow: "bg-yellow text-card-dark",
    dark: "bg-[#2A2A2A] text-white",
    ghost: "bg-white text-card-dark",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`press-scale w-full h-[52px] rounded-full font-urbanist font-extrabold text-base flex items-center justify-center gap-2 ${styles} ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="font-urbanist font-bold text-card-dark text-sm">{title}</span>
      {action && (
        <button onClick={onAction} className="font-urbanist font-medium text-text-gray text-xs press-scale">
          {action}
        </button>
      )}
    </div>
  );
}

// ───────── Bottom sheet ─────────
export function Sheet({ onClose, children, title, light }: { onClose: () => void; children: ReactNode; title?: string; light?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        className={`slide-up relative w-full max-w-[390px] max-h-[92vh] overflow-y-auto no-scrollbar rounded-t-[20px] p-5 pb-8 ${light ? "bg-cream" : "bg-card-dark"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-[#555] mx-auto mb-4" />
        {title && (
          <div className="flex items-center justify-between mb-4">
            <span className={`font-urbanist font-extrabold text-lg ${light ? "text-card-dark" : "text-white"}`}>{title}</span>
            <button onClick={onClose} aria-label="Fermer" className={`press-scale w-8 h-8 rounded-full flex items-center justify-center ${light ? "bg-card-dark" : "bg-[#2A2A2A]"}`}>
              <X size={16} className="text-white" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ───────── Récapitulatif De / Vers / Montant / Frais / Total ─────────
export function SummaryRows({ rows }: { rows: [string, string][] }) {
  return (
    <div className="space-y-3">
      {rows.map(([label, value], i) => (
        <div key={label} className="flex justify-between gap-4">
          <span className="font-urbanist font-medium text-text-gray text-sm shrink-0">{label}</span>
          <span className={`font-urbanist text-sm text-right break-all ${i === rows.length - 1 ? "text-yellow font-bold" : "text-white font-semibold"}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ───────── Animation de succès (cercle jaune → ✓) ─────────
export function SuccessOverlay({ title, subtitle, detail, onDone }: { title: string; subtitle?: string; detail?: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2600);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <div className="fixed inset-0 bg-card-dark flex flex-col items-center justify-center z-[120] px-8 text-center" onClick={onDone}>
      <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-yellow success-circle-soft" />
        <span className="relative success-check text-card-dark text-5xl font-black">✓</span>
      </div>
      <span className="font-urbanist font-extrabold text-white text-2xl">{title}</span>
      {subtitle && <span className="font-urbanist font-semibold text-yellow text-lg mt-2">{subtitle}</span>}
      {detail && <span className="font-urbanist text-text-gray text-sm mt-3">{detail}</span>}
    </div>
  );
}

// ───────── Saisie de PIN ─────────
export function PinDots({ length, filled, error }: { length: number; filled: number; error?: boolean }) {
  return (
    <div className={`flex gap-3 justify-center ${error ? "shake" : ""}`}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} className={`w-3.5 h-3.5 rounded-full transition-colors ${i < filled ? (error ? "bg-loss" : "bg-yellow") : "bg-[#3A3A3A]"}`} />
      ))}
    </div>
  );
}

export function PinKeypad({ onKey, onBiometric, dark = true }: { onKey: (k: string) => void; onBiometric?: () => void; dark?: boolean }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", onBiometric ? "bio" : "", "0", "del"];
  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((k, i) =>
        k === "" ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            onClick={() => (k === "bio" ? onBiometric?.() : onKey(k))}
            aria-label={k === "del" ? "Effacer" : k === "bio" ? "Biométrie" : k}
            className={`press-scale-strong h-16 rounded-[20px] font-urbanist font-bold text-2xl flex items-center justify-center ${
              dark ? (k === "del" || k === "bio" ? "bg-transparent text-white" : "bg-[#2A2A2A] text-white") : k === "del" ? "bg-card-dark text-white" : "bg-white text-card-dark"
            }`}
          >
            {k === "del" ? <Delete size={22} /> : k === "bio" ? <Fingerprint size={26} className="text-yellow" /> : k}
          </button>
        ),
      )}
    </div>
  );
}

/** Hook de saisie d'un code à N chiffres. */
export function useCodeInput(length: number, onComplete: (code: string) => void) {
  const [code, setCode] = useState("");
  const press = (k: string) => {
    if (k === "del") return setCode((c) => c.slice(0, -1));
    setCode((c) => {
      if (c.length >= length) return c;
      const next = c + k;
      if (next.length === length) setTimeout(() => onComplete(next), 120);
      return next;
    });
  };
  return { code, press, reset: () => setCode("") };
}

/** Demande le PIN (ou la biométrie) avant une opération sensible. */
export function PinPrompt({ onSuccess, onClose, title = "Confirmez avec votre PIN" }: { onSuccess: () => void; onClose: () => void; title?: string }) {
  const { state } = useApp();
  const [error, setError] = useState(false);
  const { code, press, reset } = useCodeInput(6, (c) => {
    if (hashPin(c) === state.user?.pinHash) onSuccess();
    else {
      setError(true);
      setTimeout(() => {
        setError(false);
        reset();
      }, 600);
    }
  });
  return (
    <Sheet onClose={onClose} title={title}>
      <div className="py-4 mb-6">
        <PinDots length={6} filled={code.length} error={error} />
        {error && <p className="text-center text-loss text-xs font-urbanist font-semibold mt-3">PIN incorrect</p>}
      </div>
      <PinKeypad onKey={press} onBiometric={state.user?.biometrics ? onSuccess : undefined} />
    </Sheet>
  );
}

// ───────── Pavé numérique montant ─────────
export function Numpad({ onKey, allowDecimal = true }: { onKey: (k: string) => void; allowDecimal?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", allowDecimal ? "." : "", "0", "del"].map((key, i) =>
        key === "" ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            onClick={() => onKey(key)}
            aria-label={key === "del" ? "Effacer" : key}
            className={`press-scale-strong h-[60px] rounded-[20px] font-urbanist font-bold text-2xl flex items-center justify-center ${
              key === "del" ? "bg-card-dark text-white" : "bg-white text-card-dark active:bg-yellow/30"
            }`}
          >
            {key === "del" ? <ArrowLeft size={22} /> : key}
          </button>
        ),
      )}
    </div>
  );
}

export function applyNumpadKey(prev: string, key: string, maxDecimals = 8): string {
  if (key === "del") return prev.length <= 1 ? "0" : prev.slice(0, -1);
  if (key === ".") return prev.includes(".") ? prev : prev + ".";
  const [, dec] = prev.split(".");
  if (dec !== undefined && dec.length >= maxDecimals) return prev;
  if (prev.replace(".", "").length >= 12) return prev;
  return prev === "0" ? key : prev + key;
}

// ───────── Bannière réseau (mode hors-ligne, CDC 8.4) ─────────
export function NetworkBanner() {
  const { source, online, updatedAt } = usePrices();
  if (online && source === "live") return null;
  const time = updatedAt ? new Date(updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <div className="bg-card-dark rounded-full px-4 py-2 flex items-center gap-2">
      <WifiOff size={14} className="text-yellow shrink-0" />
      <span className="font-urbanist text-white text-[11px] font-semibold">
        {!online ? "Hors ligne" : "API Binance injoignable"} — {time ? `prix du ${time}` : "prix indicatifs du CDC"}
      </span>
    </div>
  );
}

export function InfoNote({ children, tone = "yellow" }: { children: ReactNode; tone?: "yellow" | "red" }) {
  return (
    <div className={`rounded-[16px] p-3 text-xs font-urbanist font-medium ${tone === "yellow" ? "bg-yellow/15 text-card-dark" : "bg-loss/10 text-loss"}`}>
      {children}
    </div>
  );
}

/** Bandeau « devis garanti » avec compte à rebours (sur fond sombre). */
export function QuoteBadge({ secondsLeft, expired, onRefresh }: { secondsLeft: number; expired: boolean; onRefresh: () => void }) {
  return (
    <div className={`rounded-[16px] px-3 py-2 mb-4 flex items-center justify-between ${expired ? "bg-loss/15" : "bg-yellow/10"}`}>
      <span className={`font-urbanist text-xs font-semibold ${expired ? "text-loss" : "text-yellow"}`}>
        {expired ? "Devis expiré — le cours a pu changer" : `🔒 Prix garanti encore ${secondsLeft} s`}
      </span>
      {expired && (
        <button onClick={onRefresh} className="press-scale font-urbanist font-bold text-xs text-white bg-[#2A2A2A] rounded-full px-3 py-1">
          Actualiser
        </button>
      )}
    </div>
  );
}
