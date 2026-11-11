import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Fingerprint, MessageSquareText, ShieldCheck, Send, ShoppingCart, TriangleAlert } from "lucide-react";
import logo from "@/assets/logo.png";
import { LANGS, translate, type Lang } from "@/lib/i18n";
import { COUNTRIES, COUNTRY_MAP, DEMO_MODE, DEMO_OTP, formatIntlPhone, formatNationalNumber, type CountryCode } from "@/lib/config";
import { hashPin, useApp } from "@/store/AppStore";
import { PinDots, PinKeypad, PrimaryButton, Sheet, Toggle, useCodeInput } from "@/components/kit";
import { LegalDocSheet } from "@/components/kit/LegalDocSheet";
import type { LegalDoc } from "@/lib/legal";

type Step = "splash" | "lang" | "phone" | "otp" | "name" | "pin" | "pin2" | "bio" | "tutorial";

const ORDER: Step[] = ["splash", "lang", "phone", "otp", "name", "pin", "pin2", "bio", "tutorial"];


function Shell({ children, onBack, progress }: { children: React.ReactNode; onBack?: () => void; progress?: number }) {
  return (
    <div className="dot-grid min-h-screen flex justify-center">
      <div className="w-full max-w-[390px] min-h-screen px-5 pt-5 pb-8 flex flex-col screen-fade">
        <div className="flex items-center gap-3 mb-6 h-9">
          {onBack && (
            <button onClick={onBack} aria-label="Retour" className="press-scale w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
              <ArrowLeft size={18} className="text-white" />
            </button>
          )}
          {progress !== undefined && (
            <div className="flex-1 h-1.5 rounded-full bg-border-sand overflow-hidden">
              <div className="h-full bg-card-dark rounded-full transition-all duration-300" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-urbanist font-black text-card-dark text-[28px] leading-tight">{children}</h1>
      {sub && <p className="font-urbanist text-text-gray text-sm mt-2">{sub}</p>}
    </div>
  );
}

/** Étape OTP réutilisable (inscription et PIN oublié). */
/** `phone` : numéro international déjà formaté (ex. « +227 90 12 34 56 »). */
export function OtpStep({ phone, onVerified }: { phone: string; onVerified: () => void }) {
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(30);
  const { code, press, reset } = useCodeInput(6, (c) => {
    if (c === DEMO_OTP) onVerified();
    else {
      setError(true);
      setTimeout(() => {
        setError(false);
        reset();
      }, 700);
    }
  });
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  return (
    <>
      <Title sub={<>Code envoyé par SMS au <b className="text-card-dark">{phone}</b></>}>Vérification</Title>
      {DEMO_MODE && (
        <div className="bg-card-dark rounded-[16px] px-4 py-3 mb-6 flex items-center gap-3">
          <MessageSquareText size={18} className="text-yellow shrink-0" />
          <span className="font-urbanist text-white text-xs">
            Démo : aucun SMS n'est envoyé. Code : <b className="text-yellow tracking-widest">{DEMO_OTP}</b>
          </span>
        </div>
      )}
      <div className="flex gap-2 justify-center mb-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-11 h-14 rounded-[14px] flex items-center justify-center font-urbanist font-black text-2xl ${
              error ? "bg-loss/15 text-loss" : i === code.length ? "bg-white ring-2 ring-card-dark" : "bg-white text-card-dark"
            }`}
          >
            {code[i] ?? ""}
          </div>
        ))}
      </div>
      <div className="text-center mb-auto">
        {error ? (
          <span className="font-urbanist text-loss text-xs font-semibold">Code incorrect</span>
        ) : timer > 0 ? (
          <span className="font-urbanist text-text-gray text-xs">Renvoyer le code dans {timer} s</span>
        ) : (
          <button onClick={() => setTimer(30)} className="font-urbanist text-card-dark text-xs font-bold underline">
            Renvoyer le code
          </button>
        )}
      </div>
      <div className="mt-6">
        <PinKeypad onKey={press} dark={false} />
      </div>
    </>
  );
}

export default function Onboarding() {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<Step>("splash");
  const [lang, setLang] = useState<Lang>("fr");
  const [country, setCountry] = useState<CountryCode>("NE");
  const [countryPicker, setCountryPicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [consentCgu, setConsentCgu] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [doc, setDoc] = useState<LegalDoc["id"] | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [bio, setBio] = useState(true);
  const [slide, setSlide] = useState(0);

  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const idx = ORDER.indexOf(step);
  const progress = idx / (ORDER.length - 1);
  const back = () => setStep(ORDER[Math.max(0, idx - 1)]);

  const pin1 = useCodeInput(6, (c) => {
    setPin(c);
    setStep("pin2");
    pin1.reset();
  });
  const pin2 = useCodeInput(6, (c) => {
    if (c === pin) setStep("bio");
    else {
      setPinError(true);
      setTimeout(() => {
        setPinError(false);
        pin2.reset();
      }, 700);
    }
  });

  const finish = () => {
    const handle = "@" + (firstName + (lastName ? "." + lastName : "")).toLowerCase().normalize("NFD").replace(/[^a-z0-9.]/g, "").slice(0, 20);
    completeOnboarding({
      country,
      phone: formatIntlPhone(country, phone),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      handle,
      pinHash: hashPin(pin),
      biometrics: bio,
      lang,
      consentAt: Date.now(),
    });
  };

  if (step === "splash") {
    return (
      <div className="dot-grid min-h-screen flex items-center justify-center">
        <div className="max-w-[390px] w-full flex flex-col items-center justify-center min-h-screen px-5">
          <img src={logo} alt="CryptoPay Niger" className="h-24 w-24 rounded-[24px] object-cover mb-6" />
          <h1 className="font-urbanist font-black text-card-dark text-4xl italic">CryptoPay</h1>
          <p className="font-urbanist font-semibold text-text-gray text-sm mb-3 tracking-[0.3em]">NIGER</p>
          <p className="font-urbanist text-card-dark/70 text-center text-sm mb-10 max-w-[260px]">
            Achetez, stockez et envoyez des cryptos depuis votre banque ou votre Mobile Money, partout dans l'UEMOA.
          </p>
          <PrimaryButton onClick={() => setStep("lang")} className="max-w-[280px]">
            Commencer
          </PrimaryButton>
        </div>
      </div>
    );
  }

  if (step === "lang") {
    return (
      <Shell onBack={back} progress={progress}>
        <Title sub="Choose your language · Zaɓi harshe">Choisissez votre langue</Title>
        <div className="space-y-3">
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={`press-scale w-full rounded-[20px] p-5 flex items-center justify-between ${lang === l.id ? "bg-card-dark" : "bg-white"}`}
            >
              <div className="text-left">
                <div className={`font-urbanist font-bold text-base ${lang === l.id ? "text-white" : "text-card-dark"}`}>{l.label}</div>
                <div className="font-urbanist text-text-gray text-xs">{translate(l.id, "welcome")}</div>
              </div>
              {lang === l.id && (
                <div className="w-7 h-7 rounded-full bg-yellow flex items-center justify-center">
                  <Check size={16} className="text-card-dark" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
        {lang !== "fr" && <p className="font-urbanist text-text-gray text-[11px] mt-4">Traduction partielle : certains écrans restent en français.</p>}
        <div className="mt-auto pt-6">
          <PrimaryButton onClick={() => setStep("phone")}>{t("action.continue")}</PrimaryButton>
        </div>
      </Shell>
    );
  }

  if (step === "phone") {
    const c = COUNTRY_MAP[country];
    const valid = c.pattern.test(phone);
    return (
      <Shell onBack={back} progress={progress}>
        <Title sub="Le numéro lié à votre banque ou à votre wallet Mobile Money : il sert d'alias PI-SPI pour vos paiements.">Votre numéro</Title>
        <div className="bg-white rounded-[20px] h-16 flex items-center px-4 gap-3 mb-2">
          <button onClick={() => setCountryPicker(true)} aria-label="Pays" className="press-scale flex items-center gap-1 font-urbanist font-bold text-card-dark text-lg whitespace-nowrap">
            <span className="text-[11px] bg-card-dark text-yellow rounded-md px-1.5 py-0.5">{c.code}</span>+{c.dial}
            <ChevronDown size={14} className="text-text-gray" />
          </button>
          <div className="w-px h-8 bg-border-sand" />
          <input
            inputMode="numeric"
            autoFocus
            aria-label="Numéro de téléphone"
            value={formatNationalNumber(phone, c.digits)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, c.digits))}
            placeholder={c.example}
            className="flex-1 bg-transparent outline-none font-urbanist font-bold text-card-dark text-lg placeholder:text-[#C8C3BA]"
          />
        </div>
        {phone.length === c.digits && !valid && <p className="font-urbanist text-loss text-xs mb-2">Numéro invalide pour {c.name}</p>}

        <div className="space-y-3 mt-6">
          <div className="flex items-start gap-3">
            <button
              role="checkbox"
              aria-checked={consentCgu}
              onClick={() => setConsentCgu(!consentCgu)}
              className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center ${consentCgu ? "bg-card-dark" : "bg-white border-2 border-[#CCC]"}`}
            >
              {consentCgu && <Check size={14} className="text-yellow" strokeWidth={3} />}
            </button>
            <span className="font-urbanist text-card-dark text-xs leading-relaxed">
              J'accepte les{" "}
              <button onClick={() => setDoc("cgu")} className="font-bold underline">
                Conditions Générales
              </button>{" "}
              et je comprends que les crypto-actifs sont volatils.
            </span>
          </div>
          <div className="flex items-start gap-3">
            <button
              role="checkbox"
              aria-checked={consentData}
              onClick={() => setConsentData(!consentData)}
              className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center ${consentData ? "bg-card-dark" : "bg-white border-2 border-[#CCC]"}`}
            >
              {consentData && <Check size={14} className="text-yellow" strokeWidth={3} />}
            </button>
            <span className="font-urbanist text-card-dark text-xs leading-relaxed">
              Je consens au traitement de mes données personnelles conformément à la{" "}
              <button onClick={() => setDoc("privacy")} className="font-bold underline">
                Politique de confidentialité
              </button>{" "}
              (Loi N°2017-28).
            </span>
          </div>
        </div>
        <div className="mt-auto pt-6">
          <PrimaryButton disabled={!valid || !consentCgu || !consentData} onClick={() => setStep("otp")}>
            RECEVOIR LE CODE →
          </PrimaryButton>
        </div>
        {doc && <LegalDocSheet id={doc} onClose={() => setDoc(null)} />}
        {countryPicker && (
          <Sheet onClose={() => setCountryPicker(false)} title="Votre pays">
            <div className="space-y-1">
              {COUNTRIES.map((k) => (
                <button
                  key={k.code}
                  onClick={() => {
                    setCountry(k.code);
                    setPhone("");
                    setCountryPicker(false);
                  }}
                  className="press-scale w-full flex items-center gap-3 p-3 rounded-[16px] hover:bg-[#2A2A2A] text-left"
                >
                  <span className="font-urbanist font-bold text-[11px] bg-[#2A2A2A] text-yellow rounded-md px-1.5 py-0.5 w-8 text-center">{k.code}</span>
                  <span className="flex-1 font-urbanist font-semibold text-white text-sm">{k.name}</span>
                  <span className="font-urbanist text-text-gray text-sm">+{k.dial}</span>
                  {country === k.code && <Check size={16} className="text-yellow" />}
                </button>
              ))}
            </div>
            <p className="font-urbanist text-text-gray text-[11px] mt-4">Les 8 pays de l'UEMOA, reliés par PI-SPI (BCEAO).</p>
          </Sheet>
        )}
      </Shell>
    );
  }

  if (step === "otp") {
    return (
      <Shell onBack={back} progress={progress}>
        <OtpStep phone={formatIntlPhone(country, phone)} onVerified={() => setStep("name")} />
      </Shell>
    );
  }

  if (step === "name") {
    const valid = firstName.trim().length >= 2 && lastName.trim().length >= 2;
    return (
      <Shell onBack={back} progress={progress}>
        <Title sub="Tel qu'il figure sur votre pièce d'identité.">Comment vous appelez-vous ?</Title>
        <div className="space-y-3">
          {[
            ["Prénom", firstName, setFirstName],
            ["Nom", lastName, setLastName],
          ].map(([label, value, set]) => (
            <div key={label as string} className="bg-white rounded-[20px] px-4 py-3">
              <label className="font-urbanist text-text-gray text-[11px] font-semibold uppercase tracking-wider">{label as string}</label>
              <input
                value={value as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value.slice(0, 40))}
                className="w-full bg-transparent outline-none font-urbanist font-bold text-card-dark text-lg"
              />
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6">
          <PrimaryButton disabled={!valid} onClick={() => setStep("pin")}>
            {t("action.continue")}
          </PrimaryButton>
        </div>
      </Shell>
    );
  }

  if (step === "pin" || step === "pin2") {
    const input = step === "pin" ? pin1 : pin2;
    return (
      <div className="min-h-screen bg-card-dark flex justify-center">
        <div className="w-full max-w-[390px] min-h-screen px-5 pt-5 pb-8 flex flex-col">
          <button onClick={back} aria-label="Retour" className="press-scale w-9 h-9 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-8">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h1 className="font-urbanist font-black text-white text-[28px] leading-tight mb-2">{step === "pin" ? "Créez votre PIN" : "Confirmez votre PIN"}</h1>
          <p className="font-urbanist text-text-gray text-sm mb-10">6 chiffres, pour valider chaque opération. Ne le partagez jamais.</p>
          <PinDots length={6} filled={input.code.length} error={pinError} />
          {pinError && <p className="text-center text-loss text-xs font-urbanist font-semibold mt-3">Les codes ne correspondent pas</p>}
          <div className="mt-auto">
            <PinKeypad onKey={input.press} />
          </div>
        </div>
      </div>
    );
  }

  if (step === "bio") {
    return (
      <Shell onBack={back} progress={progress}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-card-dark flex items-center justify-center mb-6">
            <Fingerprint size={44} className="text-yellow" />
          </div>
          <h1 className="font-urbanist font-black text-card-dark text-[26px] mb-2">Déverrouillage biométrique</h1>
          <p className="font-urbanist text-text-gray text-sm max-w-[280px] mb-8">Utilisez Face ID ou votre empreinte pour ouvrir l'app et confirmer vos opérations.</p>
          <div className="bg-white rounded-[20px] p-5 w-full flex items-center justify-between">
            <span className="font-urbanist font-bold text-card-dark text-sm">Activer Face ID / empreinte</span>
            <Toggle checked={bio} onChange={setBio} label="Biométrie" />
          </div>
        </div>
        <PrimaryButton onClick={() => setStep("tutorial")}>{t("action.continue")}</PrimaryButton>
      </Shell>
    );
  }

  // Tutoriel interactif
  const slides = [
    { icon: ShoppingCart, title: "Payez avec PI-SPI", body: "Achetez BTC, ETH, USDT ou USDC depuis votre banque, votre wallet Mobile Money ou votre microfinance, dans les 8 pays de l'UEMOA. Paiement instantané, 24h/24." },
    { icon: Send, title: "Envoyez partout", body: "Vers Binance, OKX, un autre wallet ou un ami CryptoPay (@nom) — gratuitement entre utilisateurs." },
    { icon: ShieldCheck, title: "Vos fonds protégés", body: "PIN, biométrie et vérification d'identité progressive. 95 % des fonds conservés hors ligne." },
    { icon: TriangleAlert, title: "Investissez prudemment", body: "Les cryptos sont volatiles. Commencez petit et privilégiez les stablecoins (USDT, USDC) pour épargner." },
  ];
  const s = slides[slide];
  const last = slide === slides.length - 1;
  return (
    <Shell>
      <div className="flex justify-end -mt-14 mb-8">
        <button onClick={finish} className="font-urbanist font-semibold text-text-gray text-sm press-scale">
          Passer
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center" key={slide}>
        <div className="w-28 h-28 rounded-[28px] bg-card-dark flex items-center justify-center mb-8 screen-fade">
          <s.icon size={48} className="text-yellow" />
        </div>
        <h1 className="font-urbanist font-black text-card-dark text-[26px] mb-3">{s.title}</h1>
        <p className="font-urbanist text-text-gray text-sm max-w-[290px]">{s.body}</p>
      </div>
      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all ${i === slide ? "w-6 bg-card-dark" : "w-2 bg-[#CCC]"}`} />
        ))}
      </div>
      <PrimaryButton onClick={() => (last ? finish() : setSlide(slide + 1))}>{last ? "C'EST PARTI →" : "SUIVANT →"}</PrimaryButton>
    </Shell>
  );
}
