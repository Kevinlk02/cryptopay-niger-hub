import { RefreshCw } from "lucide-react";
import { SUPPORT } from "@/lib/config";
import { usePrices } from "@/hooks/usePrices";
import { useNav } from "@/store/nav";
import { TopBar } from "@/components/kit";

type Level = "ok" | "degraded" | "down";

const DOT: Record<Level, string> = { ok: "bg-gain", degraded: "bg-yellow", down: "bg-loss" };
const TXT: Record<Level, string> = { ok: "Opérationnel", degraded: "Perturbé", down: "Indisponible" };

function watHour() {
  return (new Date().getUTCHours() + 1) % 24;
}

/** État des services en temps réel — pour ne jamais laisser l'utilisateur dans le flou. */
export default function StatusScreen() {
  const { back } = useNav();
  const { source, online, refetch, updatedAt } = usePrices();
  const priceLevel: Level = !online ? "down" : source === "live" ? "ok" : "degraded";
  const supportOpen = watHour() >= 8 && watHour() < 20;

  const groups: { title: string; items: { name: string; level: Level; note?: string; simulated?: boolean }[] }[] = [
    {
      title: "Paiements",
      items: [
        { name: "PI-SPI — achats (demandes de paiement)", level: "ok", simulated: true },
        { name: "PI-SPI — retraits instantanés", level: "ok", simulated: true },
      ],
    },
    {
      title: "Marché",
      items: [{ name: "Cours en temps réel (Binance)", level: priceLevel, note: updatedAt ? `Mis à jour à ${new Date(updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : undefined }],
    },
    {
      title: "Réseaux blockchain (envois & réceptions)",
      items: ["Bitcoin", "Lightning", "Ethereum (ERC-20)", "Tron (TRC-20)", "BNB Chain (BEP-20)", "Solana"].map((n) => ({ name: n, level: "ok" as Level, simulated: true })),
    },
    {
      title: "Comptes",
      items: [
        { name: "Vérification d'identité (KYC)", level: "ok", simulated: true },
        { name: `Support en direct (${SUPPORT.hours})`, level: supportOpen ? "ok" : "degraded", note: supportOpen ? undefined : "Fermé — tickets traités à la réouverture" },
      ],
    },
  ];

  const all = groups.flatMap((g) => g.items);
  const worst: Level = all.some((i) => i.level === "down") ? "down" : all.some((i) => i.level === "degraded") ? "degraded" : "ok";

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar
        title="État des services"
        onBack={back}
        right={
          <button onClick={() => refetch()} aria-label="Actualiser" className="press-scale w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
            <RefreshCw size={16} className="text-white" />
          </button>
        }
      />
      <div className="bg-card-dark rounded-[20px] p-5 flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${DOT[worst]}`} />
        <span className="font-urbanist font-bold text-white text-sm">
          {worst === "ok" ? "Tous les services fonctionnent" : worst === "degraded" ? "Certains services sont perturbés" : "Incident en cours"}
        </span>
      </div>
      {groups.map((g) => (
        <div key={g.title}>
          <div className="font-urbanist font-bold text-card-dark text-sm mb-2">{g.title}</div>
          <div className="bg-white rounded-[20px] px-4 divide-y divide-border-sand">
            {g.items.map((i) => (
              <div key={i.name} className="py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-urbanist font-semibold text-card-dark text-sm">{i.name}</div>
                  {(i.note || i.simulated) && <div className="font-urbanist text-text-gray text-[10px]">{i.note ?? "Démo : statut simulé"}</div>}
                </div>
                <span className={`w-2 h-2 rounded-full ${DOT[i.level]}`} />
                <span className="font-urbanist text-xs text-card-dark">{TXT[i.level]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
