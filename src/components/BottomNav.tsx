import { Home, TrendingUp, Plus, Wallet, User } from "lucide-react";

type Tab = "home" | "market" | "fab" | "wallet" | "profile";

interface BottomNavProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
  onFab: () => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "market", label: "Marché", icon: TrendingUp },
  { id: "fab", label: "", icon: Plus },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "profile", label: "Profil", icon: User },
];

export default function BottomNav({ active, onNavigate, onFab }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-16 bg-white border-t border-border-sand flex items-end justify-around px-2 z-50">
      {tabs.map((tab) => {
        if (tab.id === "fab") {
          return (
            <button
              key="fab"
              onClick={onFab}
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
            onClick={() => onNavigate(tab.id)}
            className="press-scale flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 min-w-[56px]"
          >
            <Icon size={22} className={isActive ? "text-card-dark" : "text-[#AAAAAA]"} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-urbanist ${isActive ? "font-bold text-card-dark" : "font-medium text-[#AAAAAA]"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
