import { KYC_LEVELS } from "@/lib/config";
import { formatMoney, formatNumber } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { PrimaryButton, TopBar } from "@/components/kit";

function Bar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, (used / limit) * 100);
  return (
    <div>
      <div className="flex justify-between font-urbanist text-xs mb-1.5">
        <span className="text-text-gray">{label}</span>
        <span className="text-white font-semibold">
          {formatMoney(used)} / {limit === null ? "illimité" : formatMoney(limit)}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[#3A3A3A] overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-loss" : "bg-yellow"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function LimitsScreen() {
  const { state, usage } = useApp();
  const { back, go } = useNav();
  const level = state.user!.kycLevel;

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Limites & plafonds" onBack={back} />

      <div className="bg-card-dark rounded-[20px] p-5 space-y-4">
        <div className="font-urbanist font-bold text-white text-sm">Consommation · Niveau {level}</div>
        <Bar label="Sur 24 h" used={usage.day} limit={usage.dailyLimit} />
        <Bar label="Ce mois-ci" used={usage.month} limit={usage.monthlyLimit} />
        <p className="font-urbanist text-text-gray text-[10px]">Achats, retraits PI-SPI et envois externes. Plafond PI-SPI : 5 000 000 FCFA par paiement. Les envois entre utilisateurs CryptoPay ne sont pas comptés.</p>
      </div>

      <div className="bg-white rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-[1fr_1.2fr_1.2fr] px-4 py-3 border-b border-border-sand font-urbanist font-bold text-[11px] text-text-gray uppercase tracking-wider">
          <span>Niveau</span>
          <span className="text-right">Par jour</span>
          <span className="text-right">Par mois</span>
        </div>
        {KYC_LEVELS.map((l) => (
          <div
            key={l.level}
            className={`grid grid-cols-[1fr_1.2fr_1.2fr] px-4 py-3 font-urbanist text-xs ${l.level === level ? "bg-yellow/30 font-bold text-card-dark" : "text-card-dark"} ${l.level < 3 ? "border-b border-border-sand" : ""}`}
          >
            <span>
              {l.title}
              {l.level === level ? " ●" : ""}
            </span>
            <span className="text-right">{l.daily === null ? "Illimité*" : formatNumber(l.daily)}</span>
            <span className="text-right">{l.monthly === null ? "Illimité*" : formatNumber(l.monthly)}</span>
          </div>
        ))}
      </div>
      <p className="font-urbanist text-text-gray text-[10px]">Montants en FCFA. *Sur approbation individuelle.</p>

      {level < 3 && <PrimaryButton onClick={() => go({ name: "kyc" })}>AUGMENTER MES PLAFONDS</PrimaryButton>}
    </div>
  );
}
