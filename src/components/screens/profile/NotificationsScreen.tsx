import { toast } from "sonner";
import { useApp, type NotificationPrefs } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { Toggle, TopBar } from "@/components/kit";

const CATEGORIES: { key: keyof NotificationPrefs; title: string; sub: string }[] = [
  { key: "transactions", title: "Transactions", sub: "Achats, envois, réceptions, retraits" },
  { key: "market", title: "Marché", sub: "Alertes de prix et fortes variations" },
  { key: "security", title: "Sécurité", sub: "Nouvelles connexions, changement de PIN" },
  { key: "promos", title: "Promotions", sub: "Offres, parrainage, nouveautés" },
];

const CHANNELS: { key: keyof NotificationPrefs; title: string }[] = [
  { key: "push", title: "Notifications push" },
  { key: "sms", title: "SMS" },
  { key: "email", title: "E-mail" },
];

export default function NotificationsScreen() {
  const { state, update } = useApp();
  const { back } = useNav();
  const prefs = state.notifications;

  const set = async (key: keyof NotificationPrefs, v: boolean) => {
    if (key === "security" && !v) toast("Déconseillé", { description: "Les alertes de sécurité protègent votre compte." });
    if (key === "push" && v && "Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }
    update((s) => ({ ...s, notifications: { ...s.notifications, [key]: v } }));
  };

  const Item = ({ k, title, sub }: { k: keyof NotificationPrefs; title: string; sub?: string }) => (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1">
        <div className="font-urbanist font-semibold text-card-dark text-sm">{title}</div>
        {sub && <div className="font-urbanist text-text-gray text-[11px]">{sub}</div>}
      </div>
      <Toggle checked={prefs[k]} onChange={(v) => set(k, v)} label={title} />
    </div>
  );

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Notifications" onBack={back} />
      <div className="bg-white rounded-[20px] px-4 divide-y divide-border-sand">
        {CATEGORIES.map((c) => (
          <Item key={c.key} k={c.key} title={c.title} sub={c.sub} />
        ))}
      </div>
      <div className="font-urbanist font-bold text-card-dark text-sm pt-2">Canaux</div>
      <div className="bg-white rounded-[20px] px-4 divide-y divide-border-sand">
        {CHANNELS.map((c) => (
          <Item key={c.key} k={c.key} title={c.title} />
        ))}
      </div>
    </div>
  );
}
