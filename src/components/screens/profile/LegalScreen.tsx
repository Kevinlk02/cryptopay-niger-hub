import { useState } from "react";
import { ChevronRight, FileText } from "lucide-react";
import { LEGAL_DOCS, type LegalDoc } from "@/lib/legal";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { TopBar } from "@/components/kit";
import { LegalDocSheet } from "@/components/kit/LegalDocSheet";

export default function LegalScreen() {
  const { state } = useApp();
  const { back } = useNav();
  const [doc, setDoc] = useState<LegalDoc["id"] | null>(null);
  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-3">
      <div className="mb-2">
        <TopBar title="CGU & Légal" onBack={back} />
      </div>
      {LEGAL_DOCS.map((d) => (
        <button key={d.id} onClick={() => setDoc(d.id)} className="press-scale w-full bg-white rounded-[20px] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center shrink-0">
            <FileText size={16} className="text-white" />
          </div>
          <span className="font-urbanist font-semibold text-card-dark text-sm flex-1 text-left">{d.title}</span>
          <ChevronRight size={16} className="text-text-gray" />
        </button>
      ))}
      <p className="font-urbanist text-text-gray text-[11px] text-center pt-2">
        Consentement donné le {new Date(state.user!.consentAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
      </p>
      {doc && <LegalDocSheet id={doc} onClose={() => setDoc(null)} />}
    </div>
  );
}
