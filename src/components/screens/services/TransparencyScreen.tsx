import { HandCoins, Lock, Scale, ShieldCheck, Snowflake, Timer } from "lucide-react";
import { ASSETS } from "@/lib/assets";
import { FEES, PISPI } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import { useNav } from "@/store/nav";
import { CoinIcon, TopBar } from "@/components/kit";

/**
 * Engagements et preuve de réserves — réponse aux faiblesses relevées chez la
 * concurrence (taux différents à l'exécution, fonctions coupées du jour au
 * lendemain, retraits bloqués, absence de licence ou de preuve de réserves).
 */
const COMMITMENTS = [
  { icon: Lock, title: "Prix garanti", body: "Le taux affiché à la confirmation est celui exécuté (devis garanti 30 s). Jamais de taux différent après coup." },
  { icon: HandCoins, title: "Frais affichés avant paiement", body: `Achat : ${formatNumber(FEES.buyCommission * 100, 1)} % + ${formatNumber(PISPI.partnerFee * 100, 1)} % PI-SPI, écart de change de ${formatNumber(FEES.spread * 100, 2)} % inclus dans le taux. Aucun frais caché.` },
  { icon: Scale, title: "Réserves 1:1", body: "Chaque crypto détenue par un client est couverte par une crypto réellement conservée : aucun prêt de vos fonds." },
  { icon: Snowflake, title: "Pas de coupure surprise", body: "Si un actif ou un service doit être retiré, préavis d'au moins 30 jours et retrait toujours possible pendant ce délai." },
  { icon: Timer, title: "Délais annoncés", body: "Chaque transaction affiche son délai prévu et son suivi étape par étape. Un problème ? Signalez-le depuis la transaction." },
  { icon: ShieldCheck, title: "Conservation sécurisée", body: "95 % des fonds hors ligne (multisig), 5 % en portefeuille chaud MPC, audits de sécurité externes." },
];

// Démo : chiffres fictifs. En production, attestation périodique par un auditeur indépendant (arbre de Merkle vérifiable par chaque client).
const RESERVES: Record<string, { liabilities: number; reserves: number }> = {
  BTC: { liabilities: 12.4, reserves: 12.61 },
  ETH: { liabilities: 96.2, reserves: 97.0 },
  USDT: { liabilities: 412_300, reserves: 418_900 },
  USDC: { liabilities: 58_100, reserves: 58_100 },
  BNB: { liabilities: 140, reserves: 141.5 },
  SOL: { liabilities: 2_050, reserves: 2_080 },
};

export default function TransparencyScreen() {
  const { back } = useNav();
  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Transparence" onBack={back} />

      <div className="font-urbanist font-bold text-card-dark text-sm">Nos engagements</div>
      <div className="space-y-3">
        {COMMITMENTS.map((c) => (
          <div key={c.title} className="bg-white rounded-[20px] p-4 flex gap-3">
            <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center shrink-0">
              <c.icon size={16} className="text-yellow" />
            </div>
            <div>
              <div className="font-urbanist font-bold text-card-dark text-sm">{c.title}</div>
              <div className="font-urbanist text-[#555] text-xs leading-relaxed mt-0.5">{c.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="font-urbanist font-bold text-card-dark text-sm pt-2">Preuve de réserves</div>
      <div className="bg-card-dark rounded-[20px] p-4">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 font-urbanist text-[10px] text-text-gray uppercase tracking-wider pb-2 border-b border-[#2A2A2A]">
          <span>Actif</span>
          <span className="text-right">Clients</span>
          <span className="text-right">Réserves</span>
          <span className="text-right">Ratio</span>
        </div>
        {ASSETS.map((a) => {
          const r = RESERVES[a.symbol];
          const ratio = (r.reserves / r.liabilities) * 100;
          return (
            <div key={a.symbol} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center py-2.5 border-b border-[#2A2A2A] last:border-0">
              <span className="flex items-center gap-2 font-urbanist font-bold text-white text-xs">
                <CoinIcon symbol={a.symbol} size={20} /> {a.symbol}
              </span>
              <span className="text-right font-urbanist text-white text-xs">{formatNumber(r.liabilities, 2)}</span>
              <span className="text-right font-urbanist text-white text-xs">{formatNumber(r.reserves, 2)}</span>
              <span className={`text-right font-urbanist font-bold text-xs ${ratio >= 100 ? "text-gain" : "text-loss"}`}>{formatNumber(ratio, 1)} %</span>
            </div>
          );
        })}
        <p className="font-urbanist text-text-gray text-[10px] mt-3">
          Démo : chiffres fictifs. Une attestation indépendante sera publiée chaque mois, avec la possibilité pour chaque client de vérifier que son solde y figure.
        </p>
      </div>
    </div>
  );
}
