import { LEGAL_DOCS, type LegalDoc } from "@/lib/legal";
import { Sheet } from "./index";

export function LegalDocSheet({ id, onClose }: { id: LegalDoc["id"]; onClose: () => void }) {
  const doc = LEGAL_DOCS.find((d) => d.id === id)!;
  return (
    <Sheet onClose={onClose} title={doc.title} light>
      <div className="bg-yellow/20 rounded-[16px] px-3 py-2 mb-4">
        <span className="font-urbanist font-semibold text-card-dark text-[11px]">Projet de texte — à valider juridiquement avant lancement</span>
      </div>
      <div className="space-y-4">
        {doc.sections.map((s) => (
          <div key={s.heading}>
            <h3 className="font-urbanist font-bold text-card-dark text-sm mb-1">{s.heading}</h3>
            <p className="font-urbanist text-[#444] text-[13px] leading-relaxed whitespace-pre-line">{s.body}</p>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
