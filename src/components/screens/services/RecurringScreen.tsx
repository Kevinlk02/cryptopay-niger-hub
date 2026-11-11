import { useState } from "react";
import { CalendarClock, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BUYABLE, type AssetSymbol } from "@/lib/assets";
import { formatMoney, formatNumber } from "@/lib/format";
import { uid, useApp, type RecurringPlan } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { Chip, CoinIcon, PrimaryButton, Sheet, TopBar } from "@/components/kit";

const PRESETS = [5_000, 10_000, 25_000, 50_000];
const FREQ: Record<RecurringPlan["frequency"], string> = { weekly: "Chaque semaine", monthly: "Chaque mois" };

export function nextRunFrom(from: number, frequency: RecurringPlan["frequency"]): number {
  const d = new Date(from);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

function NewPlanSheet({ onClose }: { onClose: () => void }) {
  const { update } = useApp();
  const [asset, setAsset] = useState<AssetSymbol>("USDT");
  const [amount, setAmount] = useState(10_000);
  const [frequency, setFrequency] = useState<RecurringPlan["frequency"]>("weekly");
  const create = () => {
    update((s) => ({ ...s, recurring: [...s.recurring, { id: uid(), asset, amountFCFA: amount, frequency, nextRun: nextRunFrom(Date.now(), frequency), active: true }] }));
    toast.success("Achat programmé créé");
    onClose();
  };
  return (
    <Sheet onClose={onClose} title="Nouvel achat programmé">
      <div className="font-urbanist text-text-gray text-xs mb-2">Crypto</div>
      <div className="flex gap-2 flex-wrap mb-4">
        {BUYABLE.map((a) => (
          <Chip key={a} onDark active={asset === a} onClick={() => setAsset(a)}>
            {a}
          </Chip>
        ))}
      </div>
      <div className="font-urbanist text-text-gray text-xs mb-2">Montant par échéance</div>
      <div className="flex gap-2 flex-wrap mb-4">
        {PRESETS.map((p) => (
          <Chip key={p} onDark active={amount === p} onClick={() => setAmount(p)}>
            {formatNumber(p)} F
          </Chip>
        ))}
      </div>
      <div className="font-urbanist text-text-gray text-xs mb-2">Fréquence</div>
      <div className="flex gap-2 mb-5">
        {(Object.keys(FREQ) as RecurringPlan["frequency"][]).map((f) => (
          <Chip key={f} onDark active={frequency === f} onClick={() => setFrequency(f)}>
            {FREQ[f]}
          </Chip>
        ))}
      </div>
      <PrimaryButton onClick={create}>CRÉER</PrimaryButton>
    </Sheet>
  );
}

export default function RecurringScreen() {
  const { state, update } = useApp();
  const { back } = useNav();
  const [creating, setCreating] = useState(false);
  const setPlan = (id: string, patch: Partial<RecurringPlan>) => update((s) => ({ ...s, recurring: s.recurring.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Achats programmés" onBack={back} />
      <div className="bg-card-dark rounded-[20px] p-5">
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock size={16} className="text-yellow" />
          <span className="font-urbanist font-bold text-white text-sm">Investir un peu, régulièrement</span>
        </div>
        <p className="font-urbanist text-text-gray text-xs leading-relaxed">
          Achetez un montant fixe chaque semaine ou chaque mois pour lisser les variations de prix. À chaque échéance, vous recevez une demande de paiement PI-SPI à
          valider : rien n'est prélevé sans votre accord.
        </p>
      </div>

      <div className="space-y-3">
        {state.recurring.map((p) => (
          <div key={p.id} className="bg-white rounded-[20px] p-4 flex items-center gap-3">
            <CoinIcon symbol={p.asset} />
            <div className="flex-1 min-w-0">
              <div className="font-urbanist font-bold text-card-dark text-sm">
                {formatMoney(p.amountFCFA)} de {p.asset}
              </div>
              <div className="font-urbanist text-text-gray text-[11px]">
                {FREQ[p.frequency]} · {p.active ? `prochain le ${new Date(p.nextRun).toLocaleDateString("fr-FR")}` : "en pause"}
              </div>
            </div>
            <button aria-label={p.active ? "Mettre en pause" : "Reprendre"} onClick={() => setPlan(p.id, { active: !p.active })} className="press-scale w-8 h-8 rounded-full bg-cream flex items-center justify-center">
              {p.active ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button aria-label="Supprimer" onClick={() => update((s) => ({ ...s, recurring: s.recurring.filter((x) => x.id !== p.id) }))} className="press-scale w-8 h-8 rounded-full bg-cream flex items-center justify-center">
              <Trash2 size={14} className="text-loss" />
            </button>
          </div>
        ))}
        {state.recurring.length === 0 && <p className="font-urbanist text-text-gray text-sm text-center py-4">Aucun achat programmé.</p>}
      </div>

      <PrimaryButton onClick={() => setCreating(true)}>+ PROGRAMMER UN ACHAT</PrimaryButton>
      {creating && <NewPlanSheet onClose={() => setCreating(false)} />}
    </div>
  );
}
