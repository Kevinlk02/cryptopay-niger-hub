import { BookOpen, CalendarClock, Gift, Smartphone, Activity, ShieldCheck, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { useNav, type Route } from "@/store/nav";
import { SectionHeader } from "@/components/kit";
import { nextRunFrom } from "./RecurringScreen";

const SERVICES: { icon: typeof Smartphone; label: string; route: Route }[] = [
  { icon: Smartphone, label: "Recharge", route: { name: "airtime" } },
  { icon: CalendarClock, label: "Achats auto", route: { name: "recurring" } },
  { icon: Gift, label: "Parrainage", route: { name: "referral" } },
  { icon: BookOpen, label: "Apprendre", route: { name: "learn" } },
  { icon: ShieldCheck, label: "Transparence", route: { name: "transparency" } },
  { icon: Activity, label: "État services", route: { name: "status" } },
];

/** Rappel des achats programmés arrivés à échéance (validation PI-SPI requise). */
export function DueRecurringBanner() {
  const { state, update } = useApp();
  const { go } = useNav();
  const due = state.recurring.find((p) => p.active && p.nextRun <= Date.now());
  if (!due) return null;
  const validate = () => {
    update((s) => ({ ...s, recurring: s.recurring.map((p) => (p.id === due.id ? { ...p, nextRun: nextRunFrom(Date.now(), p.frequency) } : p)) }));
    go({ name: "buy", asset: due.asset, amount: due.amountFCFA });
  };
  return (
    <button onClick={validate} className="press-scale w-full bg-yellow rounded-[20px] p-4 flex items-center gap-3 text-left">
      <div className="w-10 h-10 rounded-full bg-card-dark flex items-center justify-center shrink-0">
        <CalendarClock size={18} className="text-yellow" />
      </div>
      <div className="flex-1">
        <div className="font-urbanist font-bold text-card-dark text-sm">Achat programmé à valider</div>
        <div className="font-urbanist text-card-dark/70 text-[11px]">
          {formatMoney(due.amountFCFA)} de {due.asset}
        </div>
      </div>
      <ChevronRight size={16} className="text-card-dark" />
    </button>
  );
}

export function HomeServices() {
  const { go } = useNav();
  return (
    <div>
      <SectionHeader title="Services" />
      <div className="grid grid-cols-3 gap-3">
        {SERVICES.map((s) => (
          <button key={s.label} onClick={() => go(s.route)} className="press-scale bg-white rounded-[20px] py-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-card-dark flex items-center justify-center">
              <s.icon size={18} className="text-yellow" />
            </div>
            <span className="font-urbanist font-semibold text-card-dark text-[11px] text-center leading-tight">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
