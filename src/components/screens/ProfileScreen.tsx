import { Shield, CreditCard, Bell, Globe, BarChart3, HelpCircle, FileText, ChevronRight, Lock, Gauge, AtSign, Landmark } from "lucide-react";
import { COUNTRY_MAP } from "@/lib/config";
import { toast } from "sonner";
import { LANGS } from "@/lib/i18n";
import { useApp } from "@/store/AppStore";
import { useNav, type Route } from "@/store/nav";
import { Toggle, TopBar } from "@/components/kit";

export default function ProfileScreen() {
  const { state, update, t, lock } = useApp();
  const { go, back } = useNav();
  const user = state.user!;
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const items: { icon: typeof Shield; label: string; route: Route; badge?: string }[] = [
    { icon: Shield, label: "Sécurité", route: { name: "security" } },
    { icon: CreditCard, label: "KYC & Vérification", route: { name: "kyc" }, badge: user.kycPending !== null ? "En cours" : `Niveau ${user.kycLevel}` },
    { icon: Landmark, label: "Comptes de paiement PI-SPI", route: { name: "accounts" }, badge: String(user.payAccounts.length) },
    { icon: Bell, label: "Notifications", route: { name: "notifications" } },
    { icon: Globe, label: "Langue & devise", route: { name: "language" }, badge: `${LANGS.find((l) => l.id === user.lang)?.label} · ${user.currency}` },
    { icon: BarChart3, label: "Limites & plafonds", route: { name: "limits" } },
    { icon: HelpCircle, label: "Aide & Support", route: { name: "support" } },
    { icon: FileText, label: "CGU & Légal", route: { name: "legal" } },
  ];

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-5">
      <TopBar title={t("profile.title")} onBack={back} />

      <div className="bg-card-dark rounded-[20px] p-6 flex flex-col items-center">
        <div className="w-[72px] h-[72px] rounded-full bg-yellow flex items-center justify-center mb-3">
          <span className="font-urbanist font-black text-card-dark text-[28px]">{initials}</span>
        </div>
        <div className="font-urbanist font-extrabold text-white text-xl">{user.name}</div>
        <div className="font-urbanist text-text-gray text-[13px] mt-1">
          {user.phone} · {COUNTRY_MAP[user.country].name}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(user.handle).then(() => toast.success("Identifiant copié"), () => undefined);
          }}
          className="font-urbanist text-white text-xs mt-1 flex items-center gap-1 press-scale"
        >
          <AtSign size={12} className="text-yellow" /> {user.handle.slice(1)}
        </button>
        <div className="mt-3 bg-yellow text-card-dark font-urbanist font-bold text-xs px-3 py-1 rounded-full">
          KYC Niveau {user.kycLevel} {user.kycLevel > 0 ? "✓" : ""}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <button key={item.label} onClick={() => go(item.route)} className="press-scale w-full bg-white rounded-[20px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center shrink-0">
              <item.icon size={16} className="text-white" />
            </div>
            <span className="font-urbanist font-semibold text-card-dark text-sm flex-1 text-left">{item.label}</span>
            {item.badge && <span className="bg-yellow text-card-dark font-urbanist font-bold text-[10px] px-2 py-0.5 rounded-full mr-1">{item.badge}</span>}
            <ChevronRight size={16} className="text-text-gray" />
          </button>
        ))}

        <div className="w-full bg-white rounded-[20px] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center shrink-0">
            <Gauge size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-urbanist font-semibold text-card-dark text-sm">Économie de données</div>
            <div className="font-urbanist text-text-gray text-[11px]">Prix toutes les 2 min, sans graphiques</div>
          </div>
          <Toggle checked={state.dataSaver} onChange={(v) => update((s) => ({ ...s, dataSaver: v }))} label="Économie de données" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        <button onClick={lock} className="press-scale font-urbanist font-semibold text-card-dark text-sm flex items-center gap-1.5">
          <Lock size={14} /> Verrouiller l'application
        </button>
        <button onClick={lock} className="press-scale font-urbanist font-semibold text-loss text-sm">
          {t("action.logout")}
        </button>
        <span className="font-urbanist text-[#AAA] text-[10px]">CryptoPay Niger · prototype v0.3 · PI-SPI · démo</span>
      </div>
    </div>
  );
}
