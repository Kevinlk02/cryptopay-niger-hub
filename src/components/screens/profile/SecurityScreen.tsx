import { useState } from "react";
import { KeyRound, Fingerprint, Smartphone, History, Trash2, MonitorSmartphone, Lock } from "lucide-react";
import { toast } from "sonner";
import { deviceName, hashPin, useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { WithdrawalProtection } from "./WithdrawalProtection";
import { Chip, PinDots, PinKeypad, PinPrompt, PrimaryButton, Sheet, Toggle, TopBar, useCodeInput } from "@/components/kit";

function Row({ icon: Icon, title, sub, right, onClick }: { icon: typeof KeyRound; title: string; sub?: string; right?: React.ReactNode; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={`w-full bg-white rounded-[20px] p-4 flex items-center gap-3 text-left ${onClick ? "press-scale" : ""}`}>
      <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center shrink-0">
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-urbanist font-semibold text-card-dark text-sm">{title}</div>
        {sub && <div className="font-urbanist text-text-gray text-[11px]">{sub}</div>}
      </div>
      {right}
    </Comp>
  );
}

function ChangePinSheet({ onClose }: { onClose: () => void }) {
  const { state, update } = useApp();
  const [step, setStep] = useState<"old" | "new" | "confirm">("old");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fail = (msg: string, reset: () => void) => {
    setError(msg);
    setTimeout(() => {
      setError(null);
      reset();
    }, 700);
  };
  const oldIn = useCodeInput(6, (c) => (hashPin(c) === state.user!.pinHash ? setStep("new") : fail("PIN actuel incorrect", oldIn.reset)));
  const newIn = useCodeInput(6, (c) => {
    if (/^(\d)\1{5}$/.test(c) || c === "123456") return fail("PIN trop simple", newIn.reset);
    setNewPin(c);
    setStep("confirm");
  });
  const confIn = useCodeInput(6, (c) => {
    if (c !== newPin) return fail("Les codes ne correspondent pas", confIn.reset);
    update((s) => ({ ...s, user: s.user && { ...s.user, pinHash: hashPin(c) } }));
    toast.success("PIN modifié");
    onClose();
  });
  const input = step === "old" ? oldIn : step === "new" ? newIn : confIn;
  return (
    <Sheet onClose={onClose} title={step === "old" ? "PIN actuel" : step === "new" ? "Nouveau PIN" : "Confirmez le nouveau PIN"}>
      <div className="py-4 mb-4">
        <PinDots length={6} filled={input.code.length} error={!!error} />
        <p className="text-center text-loss text-xs font-urbanist font-semibold mt-3 h-4">{error}</p>
      </div>
      <PinKeypad onKey={input.press} />
    </Sheet>
  );
}

export default function SecurityScreen() {
  const { state, update, lock, deleteAccount } = useApp();
  const { back } = useNav();
  const [sheet, setSheet] = useState<null | "pin" | "delete" | "deletePin">(null);
  const user = state.user!;

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-3">
      <div className="mb-2">
        <TopBar title="Sécurité" onBack={back} />
      </div>

      <Row icon={KeyRound} title="Code PIN" sub="6 chiffres · modifier" onClick={() => setSheet("pin")} />
      <Row
        icon={Fingerprint}
        title="Face ID / empreinte"
        sub="Déverrouillage et validation"
        right={<Toggle checked={user.biometrics} onChange={(v) => update((s) => ({ ...s, user: s.user && { ...s.user, biometrics: v } }))} label="Biométrie" />}
      />

      <div className="bg-white rounded-[20px] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
            <Smartphone size={16} className="text-white" />
          </div>
          <div>
            <div className="font-urbanist font-semibold text-card-dark text-sm">Double authentification (2FA)</div>
            <div className="font-urbanist text-text-gray text-[11px]">Pour les connexions sur un nouvel appareil</div>
          </div>
        </div>
        <div className="flex gap-2">
          {([
            ["sms", "SMS"],
            ["app", "Application"],
            [null, "Désactivée"],
          ] as const).map(([v, l]) => (
            <Chip key={l} active={user.twoFA === v} onClick={() => update((s) => ({ ...s, user: s.user && { ...s.user, twoFA: v } }))}>
              {l}
            </Chip>
          ))}
        </div>
        {user.twoFA === null && <p className="font-urbanist text-loss text-[11px] mt-2">Déconseillé : votre compte est moins protégé.</p>}
      </div>

      <div className="bg-white rounded-[20px] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
            <MonitorSmartphone size={16} className="text-white" />
          </div>
          <span className="font-urbanist font-semibold text-card-dark text-sm">Appareils connectés</span>
        </div>
        <div className="flex items-center justify-between bg-cream rounded-[14px] px-3 py-2.5">
          <span className="font-urbanist font-semibold text-card-dark text-xs">{deviceName()}</span>
          <span className="font-urbanist font-bold text-[10px] bg-gain text-white px-2 py-0.5 rounded-full">Cet appareil</span>
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
            <History size={16} className="text-white" />
          </div>
          <span className="font-urbanist font-semibold text-card-dark text-sm">Journal des connexions</span>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
          {state.logins.slice(0, 10).map((l, i) => (
            <div key={i} className="flex justify-between font-urbanist text-xs">
              <span className="text-card-dark">{new Date(l.ts).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
              <span className="text-text-gray">
                {l.device} · {l.method}
              </span>
            </div>
          ))}
        </div>
      </div>

      <WithdrawalProtection />

      <Row icon={Lock} title="Verrouiller maintenant" onClick={lock} />

      <button onClick={() => setSheet("delete")} className="press-scale w-full bg-white rounded-[20px] p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-loss flex items-center justify-center">
          <Trash2 size={16} className="text-white" />
        </div>
        <div className="text-left">
          <div className="font-urbanist font-semibold text-loss text-sm">Supprimer mon compte et mes données</div>
          <div className="font-urbanist text-text-gray text-[11px]">Droit à la suppression · Loi N°2017-28</div>
        </div>
      </button>

      {sheet === "pin" && <ChangePinSheet onClose={() => setSheet(null)} />}
      {sheet === "delete" && (
        <Sheet onClose={() => setSheet(null)} title="Supprimer le compte ?">
          <p className="font-urbanist text-white text-sm mb-3">Cette action efface définitivement votre compte, vos réglages et votre historique de cet appareil.</p>
          <p className="font-urbanist text-yellow text-xs mb-5">
            ⚠ Retirez ou envoyez vos cryptos avant : un solde non nul serait perdu. Les journaux d'audit réglementaires restent conservés 5 ans.
          </p>
          <PrimaryButton onClick={() => setSheet("deletePin")} className="!bg-loss !text-white">
            SUPPRIMER DÉFINITIVEMENT
          </PrimaryButton>
        </Sheet>
      )}
      {sheet === "deletePin" && <PinPrompt title="PIN pour confirmer la suppression" onClose={() => setSheet(null)} onSuccess={deleteAccount} />}
    </div>
  );
}
