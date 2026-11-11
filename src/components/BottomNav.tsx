import { Home, TrendingUp, Plus, Wallet, User } from "lucide-react";
import { useNav, type Tab } from "@/store/nav";
import { useApp } from "@/store/AppStore";
import type { TKey } from "@/lib/i18n";

const tabs: { id: Tab | "fab"; label: TKey | ""; icon: typeof Home }[] = [
  { id: "home", label: "nav.home", icon: Home },
  { id: "market", label: "nav.market", icon: TrendingUp },
  { id: "fab", label: "", icon: Plus },
  { id: "wallet", label: "nav.wallet", icon: Wallet },
  { id: "profile", label: "nav.profile", icon: User },
];

export default function BottomNav() {
  const { tab: active, go } = useNav();
  const { t } = useApp();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-16 bg-white border-t border-border-sand flex items-end justify-around px-2 z-50">
      {tabs.map((tab) => {
        if (tab.id === "fab") {
          return (
            <button
              key="fab"
              onClick={() => go({ name: "buy" })}
              aria-label="Acheter"
              className="press-scale relative -top-4 w-14 h-14 rounded-full bg-yellow flex items-center justify-center"
              style={{ boxShadow: "0 0 0 6px #F0EDE6" }}
            >
              <Plus size={28} className="text-card-dark" strokeWidth={2.5} />
            </button>
          );
        }
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => go({ name: tab.id as Tab })}
            aria-current={isActive ? "page" : undefined}
            className="press-scale flex flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 min-w-[56px]"
          >
            <Icon size={22} className={isActive ? "text-card-dark" : "text-[#AAAAAA]"} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-urbanist ${isActive ? "font-bold text-card-dark" : "font-medium text-[#AAAAAA]"}`}>{tab.label ? t(tab.label) : ""}</span>
          </button>
        );
      })}
    </nav>
  );
}
