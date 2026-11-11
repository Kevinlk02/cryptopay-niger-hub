import { Check } from "lucide-react";
import { LANGS } from "@/lib/i18n";
import { formatMoney, type Currency } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { Chip, TopBar } from "@/components/kit";

export default function LanguageScreen() {
  const { state, update } = useApp();
  const { back } = useNav();
  const user = state.user!;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = -new Date().getTimezoneOffset() / 60;
  const isWAT = offset === 1;

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Langue & devise" onBack={back} />

      <div className="font-urbanist font-bold text-card-dark text-sm">Langue</div>
      <div className="space-y-2">
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => update((s) => ({ ...s, user: s.user && { ...s.user, lang: l.id } }))}
            className={`press-scale w-full rounded-[20px] p-4 flex items-center justify-between ${user.lang === l.id ? "bg-card-dark" : "bg-white"}`}
          >
            <span className={`font-urbanist font-bold text-sm ${user.lang === l.id ? "text-white" : "text-card-dark"}`}>{l.label}</span>
            {user.lang === l.id && (
              <div className="w-6 h-6 rounded-full bg-yellow flex items-center justify-center">
                <Check size={14} className="text-card-dark" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
      {user.lang !== "fr" && <p className="font-urbanist text-text-gray text-[11px]">Traduction partielle : certains écrans restent en français.</p>}

      <div className="font-urbanist font-bold text-card-dark text-sm pt-2">Devise d'affichage</div>
      <div className="flex gap-2">
        {(["FCFA", "USD", "EUR"] as Currency[]).map((c) => (
          <Chip key={c} active={user.currency === c} onClick={() => update((s) => ({ ...s, user: s.user && { ...s.user, currency: c } }))}>
            {c}
          </Chip>
        ))}
      </div>
      <p className="font-urbanist text-text-gray text-[11px]">
        Exemple : 100 000 FCFA = {formatMoney(100_000, user.currency)}. Les paiements PI-SPI restent en FCFA (XOF), monnaie commune des 8 pays.
      </p>

      <div className="font-urbanist font-bold text-card-dark text-sm pt-2">Fuseau horaire</div>
      <div className="bg-white rounded-[20px] p-4 flex items-center justify-between">
        <div>
          <div className="font-urbanist font-semibold text-card-dark text-sm">{isWAT ? "WAT — Heure d'Afrique de l'Ouest" : tz}</div>
          <div className="font-urbanist text-text-gray text-[11px]">
            Détecté automatiquement · UTC{offset >= 0 ? "+" : ""}
            {offset}
          </div>
        </div>
        <span className="font-urbanist font-bold text-[10px] bg-yellow text-card-dark px-2 py-0.5 rounded-full">Auto</span>
      </div>
    </div>
  );
}
