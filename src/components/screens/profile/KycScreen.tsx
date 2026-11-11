import { useState } from "react";
import { Camera, Check, Clock, FileUp, IdCard, UserRound } from "lucide-react";
import { toast } from "sonner";
import { DEMO_MODE, KYC_LEVELS, type KycLevel } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { Chip, PrimaryButton, Sheet, TopBar } from "@/components/kit";

function Upload({ label, capture, icon: Icon, file, onFile }: { label: string; capture?: "user" | "environment"; icon: typeof Camera; file: File | null; onFile: (f: File) => void }) {
  return (
    <label className={`press-scale flex items-center gap-3 rounded-[16px] p-3 cursor-pointer ${file ? "bg-gain/15" : "bg-[#2A2A2A]"}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${file ? "bg-gain" : "bg-[#3A3A3A]"}`}>
        {file ? <Check size={16} className="text-white" /> : <Icon size={16} className="text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-urbanist font-semibold text-white text-sm">{label}</div>
        <div className="font-urbanist text-text-gray text-[11px] truncate">{file ? file.name : "Prendre une photo ou choisir un fichier"}</div>
      </div>
      <input type="file" accept="image/*,application/pdf" capture={capture} className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </label>
  );
}

function SubmitSheet({ level, onClose }: { level: KycLevel; onClose: () => void }) {
  const { update } = useApp();
  const [docType, setDocType] = useState<"cni" | "passport">("cni");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const set = (k: string) => (f: File) => setFiles((s) => ({ ...s, [k]: f }));

  const required: { key: string; label: string; icon: typeof Camera; capture?: "user" | "environment" }[] =
    level === 1
      ? [
          { key: "front", label: docType === "cni" ? "CNI — recto" : "Passeport — page photo", icon: IdCard, capture: "environment" },
          ...(docType === "cni" ? [{ key: "back", label: "CNI — verso", icon: IdCard, capture: "environment" as const }] : []),
          { key: "selfie", label: "Selfie (visage bien éclairé)", icon: UserRound, capture: "user" },
        ]
      : level === 2
        ? [
            { key: "address", label: "Justificatif de domicile (< 3 mois)", icon: FileUp },
            { key: "income", label: "Justificatif de revenus", icon: FileUp },
          ]
        : [{ key: "pro", label: "Dossier professionnel (RCCM, statuts…)", icon: FileUp }];

  const complete = required.every((r) => files[r.key]);

  const submit = () => {
    // Les fichiers ne sont pas conservés dans le navigateur : en production ils sont
    // transmis chiffrés au prestataire KYC (Smile Identity) via l'Auth Service.
    update((s) => ({ ...s, user: s.user && { ...s.user, kycPending: level, kycSubmittedAt: Date.now() } }));
    toast.success("Documents envoyés", { description: "Vérification sous 24 à 48 h" });
    onClose();
  };

  return (
    <Sheet onClose={onClose} title={`Passer au niveau ${level}`}>
      {level === 1 && (
        <div className="flex gap-2 mb-4">
          <Chip onDark active={docType === "cni"} onClick={() => setDocType("cni")}>
            CNI
          </Chip>
          <Chip onDark active={docType === "passport"} onClick={() => setDocType("passport")}>
            Passeport
          </Chip>
        </div>
      )}
      <div className="space-y-2 mb-5">
        {required.map((r) => (
          <Upload key={r.key} label={r.label} icon={r.icon} capture={r.capture} file={files[r.key] ?? null} onFile={set(r.key)} />
        ))}
      </div>
      <p className="font-urbanist text-text-gray text-[11px] mb-5">Vos documents sont chiffrés et utilisés uniquement pour la vérification d'identité (obligation légale AML/KYC).</p>
      <PrimaryButton disabled={!complete} onClick={submit}>
        ENVOYER POUR VÉRIFICATION
      </PrimaryButton>
    </Sheet>
  );
}

export default function KycScreen() {
  const { state, update } = useApp();
  const { back } = useNav();
  const [submit, setSubmit] = useState<KycLevel | null>(null);
  const user = state.user!;
  const next = (user.kycLevel + 1) as KycLevel;
  const nextInfo = KYC_LEVELS[next];
  const current = KYC_LEVELS[user.kycLevel];

  const approve = () => {
    update((s) => ({ ...s, user: s.user && { ...s.user, kycLevel: s.user.kycPending ?? s.user.kycLevel, kycPending: null } }));
    toast.success("Identité vérifiée", { description: "Vos nouveaux plafonds sont actifs." });
  };

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="KYC & Vérification" onBack={back} />

      {/* Barre de progression 3 étapes */}
      <div className="bg-card-dark rounded-[20px] p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="font-urbanist text-text-gray text-xs">Votre niveau</span>
          <span className="font-urbanist font-black text-yellow text-2xl italic">Niveau {user.kycLevel}</span>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((l) => (
            <div key={l} className="flex-1">
              <div className={`h-2 rounded-full ${l <= user.kycLevel ? "bg-yellow" : l === user.kycPending ? "bg-yellow/40" : "bg-[#3A3A3A]"}`} />
              <div className={`font-urbanist text-[10px] mt-1.5 font-semibold ${l <= user.kycLevel ? "text-white" : "text-text-gray"}`}>Niveau {l}</div>
            </div>
          ))}
        </div>
        <div className="font-urbanist text-text-gray text-[11px] mt-4">
          Plafonds actuels :{" "}
          <b className="text-white">{current.daily === null ? "illimité (sur approbation)" : `${formatMoney(current.daily)}/jour · ${formatMoney(current.monthly!)}/mois`}</b>
        </div>
      </div>

      {user.kycPending !== null && (
        <div className="bg-white rounded-[20px] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-yellow flex items-center justify-center">
              <Clock size={18} className="text-card-dark" />
            </div>
            <div>
              <div className="font-urbanist font-bold text-card-dark text-sm">Vérification niveau {user.kycPending} en cours</div>
              <div className="font-urbanist text-text-gray text-[11px]">
                Envoyé le {new Date(user.kycSubmittedAt!).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · délai 24 à 48 h
              </div>
            </div>
          </div>
          {DEMO_MODE && (
            <button onClick={approve} className="w-full mt-2 h-10 rounded-full bg-card-dark text-white font-urbanist font-bold text-xs press-scale">
              Démo : simuler l'approbation
            </button>
          )}
        </div>
      )}

      {/* Détail des niveaux */}
      <div className="space-y-3">
        {KYC_LEVELS.map((l) => {
          const done = l.level <= user.kycLevel;
          return (
            <div key={l.level} className={`rounded-[20px] p-4 ${l.level === next && user.kycPending === null ? "bg-white ring-2 ring-card-dark" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-urbanist font-bold text-card-dark text-sm">{l.title}</span>
                {done ? (
                  <span className="font-urbanist font-bold text-[10px] bg-gain text-white px-2 py-0.5 rounded-full">Validé</span>
                ) : (
                  <span className="font-urbanist font-semibold text-[11px] text-text-gray">{l.daily === null ? "Illimité" : `${formatMoney(l.daily)}/jour`}</span>
                )}
              </div>
              <ul className="space-y-1">
                {l.documents.map((d) => (
                  <li key={d} className="font-urbanist text-text-gray text-xs flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${done ? "bg-gain" : "bg-[#CCC]"}`} /> {d}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {user.kycLevel < 3 && user.kycPending === null && nextInfo && (
        <PrimaryButton onClick={() => setSubmit(next)}>COMMENCER — NIVEAU {next}</PrimaryButton>
      )}
      <p className="font-urbanist text-text-gray text-[10px] text-center">Vérification opérée par un prestataire spécialisé Afrique (Smile Identity) — intégration à venir.</p>

      {submit !== null && <SubmitSheet level={submit} onClose={() => setSubmit(null)} />}
    </div>
  );
}
