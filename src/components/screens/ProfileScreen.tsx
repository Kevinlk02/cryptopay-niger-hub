import { useState } from "react";
import { ArrowLeft, Shield, CreditCard, Bell, Globe, BarChart3, HelpCircle, FileText, ChevronRight, LogOut } from "lucide-react";
import { MOCK_USER } from "@/lib/data";

const languages = ["Français", "Haoussa", "Zarma"];

interface ProfileScreenProps {
  onBack: () => void;
}

const settingsItems = [
  { icon: Shield, label: "Sécurité" },
  { icon: CreditCard, label: "KYC & Vérification", badge: "Niveau 1" },
  { icon: Bell, label: "Notifications" },
  { icon: Globe, label: "Langue", expandable: true },
  { icon: BarChart3, label: "Limites" },
  { icon: HelpCircle, label: "Aide & Support" },
  { icon: FileText, label: "CGU" },
];

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const [expandedLang, setExpandedLang] = useState(false);
  const [selectedLang, setSelectedLang] = useState("Français");

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-5">
      {/* Top Nav */}
      <div className="flex items-center">
        <button onClick={onBack} className="press-scale w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <span className="font-urbanist font-extrabold text-card-dark text-base flex-1 text-center">Profil</span>
        <div className="w-9" />
      </div>

      {/* Identity Card */}
      <div className="bg-card-dark rounded-2xl p-6 flex flex-col items-center">
        <div className="w-[72px] h-[72px] rounded-full bg-yellow flex items-center justify-center mb-3">
          <span className="font-urbanist font-black text-card-dark text-[28px]">{MOCK_USER.initials}</span>
        </div>
        <div className="font-urbanist font-extrabold text-white text-xl">{MOCK_USER.name}</div>
        <div className="font-urbanist font-normal text-text-gray text-[13px] mt-1">{MOCK_USER.phone}</div>
        <div className="mt-2 bg-yellow text-card-dark font-urbanist font-bold text-xs px-3 py-1 rounded-full">
          Niveau {MOCK_USER.kycLevel} ✓
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        {settingsItems.map((item) => (
          <div key={item.label}>
            <button
              onClick={() => item.expandable && setExpandedLang(!expandedLang)}
              className="press-scale w-full bg-white rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center shrink-0">
                <item.icon size={16} className="text-white" />
              </div>
              <span className="font-urbanist font-semibold text-card-dark text-sm flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-yellow text-card-dark font-urbanist font-bold text-[10px] px-2 py-0.5 rounded-full mr-1">{item.badge}</span>
              )}
              <ChevronRight size={16} className="text-text-gray" />
            </button>

            {/* Language Expansion */}
            {item.expandable && expandedLang && (
              <div className="mt-2 flex gap-2 px-2">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`press-scale px-4 py-2 rounded-full font-urbanist font-bold text-sm ${selectedLang === lang ? "bg-yellow text-card-dark" : "bg-card-dark text-white"}`}
                  >
                    {lang} {selectedLang === lang && "✓"}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="text-center pt-2">
        <button className="press-scale font-urbanist font-semibold text-loss text-sm">
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
