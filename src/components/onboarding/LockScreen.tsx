import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { hashPin, useApp } from "@/store/AppStore";
import { PinDots, PinKeypad, useCodeInput } from "@/components/kit";
import { OtpStep } from "./Onboarding";

const MAX_ATTEMPTS = 5;

export default function LockScreen() {
  const { state, unlock, update } = useApp();
  const user = state.user!;
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [mode, setMode] = useState<"unlock" | "otp" | "new" | "confirm">("unlock");
  const [newPin, setNewPin] = useState("");

  const unlockInput = useCodeInput(6, (c) => {
    if (hashPin(c) === user.pinHash) {
      unlock("PIN");
    } else {
      setAttempts((a) => a + 1);
      setError(true);
      setTimeout(() => {
        setError(false);
        unlockInput.reset();
      }, 600);
    }
  });
  const newInput = useCodeInput(6, (c) => {
    setNewPin(c);
    setMode("confirm");
    newInput.reset();
  });
  const confirmInput = useCodeInput(6, (c) => {
    if (c === newPin) {
      update((s) => ({ ...s, user: s.user && { ...s.user, pinHash: hashPin(c) } }));
      setAttempts(0);
      unlock("PIN");
    } else {
      setError(true);
      setTimeout(() => {
        setError(false);
        confirmInput.reset();
      }, 600);
    }
  });

  const blocked = attempts >= MAX_ATTEMPTS;
  const firstName = user.name.split(" ")[0];

  if (mode === "otp") {
    return (
      <div className="dot-grid min-h-screen flex justify-center">
        <div className="w-full max-w-[390px] min-h-screen px-5 pt-5 pb-8 flex flex-col">
          <button onClick={() => setMode("unlock")} aria-label="Retour" className="press-scale w-9 h-9 rounded-full bg-card-dark flex items-center justify-center mb-6">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <OtpStep phone={user.phone} onVerified={() => setMode("new")} />
        </div>
      </div>
    );
  }

  const input = mode === "unlock" ? unlockInput : mode === "new" ? newInput : confirmInput;
  const title = mode === "unlock" ? `Bonjour ${firstName}` : mode === "new" ? "Nouveau PIN" : "Confirmez le PIN";
  const subtitle = mode === "unlock" ? "Saisissez votre PIN" : "6 chiffres";

  return (
    <div className="min-h-screen bg-card-dark flex justify-center">
      <div className="w-full max-w-[390px] min-h-screen px-5 pt-12 pb-8 flex flex-col">
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="CryptoPay Niger" className="h-16 w-16 rounded-[18px] object-cover mb-5" />
          <h1 className="font-urbanist font-black text-white text-2xl">{title}</h1>
          <p className="font-urbanist text-text-gray text-sm mt-1">{subtitle}</p>
        </div>
        <PinDots length={6} filled={input.code.length} error={error} />
        <div className="h-8 mt-3 text-center">
          {blocked && mode === "unlock" ? (
            <span className="font-urbanist text-loss text-xs font-semibold">Trop de tentatives. Réinitialisez votre PIN par SMS.</span>
          ) : error ? (
            <span className="font-urbanist text-loss text-xs font-semibold">
              {mode === "confirm" ? "Les codes ne correspondent pas" : `PIN incorrect · ${MAX_ATTEMPTS - attempts} essai(s) restant(s)`}
            </span>
          ) : null}
        </div>
        <div className="mt-auto">
          {!(blocked && mode === "unlock") && (
            <PinKeypad onKey={input.press} onBiometric={mode === "unlock" && user.biometrics ? () => unlock("Biométrie") : undefined} />
          )}
          {mode === "unlock" && (
            <button onClick={() => setMode("otp")} className="w-full mt-6 font-urbanist font-semibold text-yellow text-sm press-scale">
              PIN oublié ?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
