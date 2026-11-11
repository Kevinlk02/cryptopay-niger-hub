import { useState } from "react";
import { Landmark, Plus, Smartphone, Users, CheckCircle2, Loader2 } from "lucide-react";
import { COUNTRIES, COUNTRY_MAP, INSTITUTION_TYPES, formatIntlPhone, formatNationalNumber, type CountryCode, type InstitutionType } from "@/lib/config";
import { uid, useApp, type PayAccount } from "@/store/AppStore";
import { Chip, PrimaryButton, Sheet } from "./index";

const ICON: Record<InstitutionType, typeof Smartphone> = { eme: Smartphone, bank: Landmark, sfd: Users };

export function PayAccountIcon({ type, size = 36 }: { type: InstitutionType; size?: number }) {
  const Icon = ICON[type];
  return (
    <div className="rounded-full bg-card-dark flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <Icon size={size * 0.44} className="text-yellow" />
    </div>
  );
}

/** Liste des comptes PI-SPI de l'utilisateur, avec sélection et ajout. */
export function PayAccountList({ selectedId, onSelect }: { selectedId?: string; onSelect?: (id: string) => void }) {
  const { state } = useApp();
  const [adding, setAdding] = useState(false);
  const accounts = state.user!.payAccounts;
  return (
    <div className="space-y-3">
      {accounts.map((a) => {
        const active = selectedId === a.id;
        return (
          <button
            key={a.id}
            onClick={() => onSelect?.(a.id)}
            className={`press-scale w-full bg-white rounded-[20px] p-4 flex items-center gap-3 ${active ? "ring-2 ring-card-dark" : ""}`}
          >
            <PayAccountIcon type={a.type} />
            <div className="text-left flex-1 min-w-0">
              <div className="font-urbanist font-bold text-card-dark text-sm truncate">{a.institution}</div>
              <div className="font-urbanist text-text-gray text-[11px]">Alias PI-SPI · {a.alias}</div>
            </div>
            {onSelect && (
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? "border-card-dark" : "border-[#CCC]"}`}>
                {active && <div className="w-2.5 h-2.5 rounded-full bg-card-dark" />}
              </div>
            )}
          </button>
        );
      })}
      <button onClick={() => setAdding(true)} className="press-scale w-full rounded-[20px] p-4 flex items-center gap-3 border-2 border-dashed border-[#D4CFC8]">
        <div className="w-9 h-9 rounded-full bg-yellow flex items-center justify-center">
          <Plus size={16} className="text-card-dark" />
        </div>
        <span className="font-urbanist font-semibold text-card-dark text-sm">Ajouter un compte PI-SPI</span>
      </button>
      {adding && (
        <AddPayAccountSheet
          onClose={() => setAdding(false)}
          onAdded={(id) => {
            setAdding(false);
            onSelect?.(id);
          }}
        />
      )}
    </div>
  );
}

/**
 * Ajout d'un compte par son alias PI-SPI. La résolution d'alias (simulée ici)
 * renvoie le nom du titulaire, qui doit correspondre à l'identité KYC.
 */
export function AddPayAccountSheet({ onClose, onAdded }: { onClose: () => void; onAdded: (id: string) => void }) {
  const { state, update } = useApp();
  const user = state.user!;
  const [type, setType] = useState<InstitutionType>("eme");
  const [institution, setInstitution] = useState("");
  const [country, setCountry] = useState<CountryCode>(user.country);
  const [digits, setDigits] = useState("");
  const [lookup, setLookup] = useState<"idle" | "loading" | "found">("idle");
  const c = COUNTRY_MAP[country];
  const validNumber = c.pattern.test(digits);
  const alias = formatIntlPhone(country, digits);
  const duplicate = user.payAccounts.some((a) => a.alias === alias && a.institution.trim().toLowerCase() === institution.trim().toLowerCase());

  const resolve = () => {
    setLookup("loading");
    setTimeout(() => setLookup("found"), 900);
  };

  const add = () => {
    const acc: PayAccount = { id: uid(), alias, institution: institution.trim(), type, holder: user.name };
    update((s) => ({ ...s, user: s.user && { ...s.user, payAccounts: [...s.user.payAccounts, acc] } }));
    onAdded(acc.id);
  };

  return (
    <Sheet onClose={onClose} title="Nouveau compte PI-SPI">
      <div className="flex gap-2 flex-wrap mb-4">
        {INSTITUTION_TYPES.map((t) => (
          <Chip key={t.id} onDark active={type === t.id} onClick={() => setType(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>
      <div className="bg-[#2A2A2A] rounded-[16px] px-4 py-3 mb-3">
        <label className="font-urbanist text-text-gray text-[10px] uppercase tracking-wider font-semibold">Établissement</label>
        <input
          value={institution}
          onChange={(e) => setInstitution(e.target.value.slice(0, 40))}
          placeholder={INSTITUTION_TYPES.find((t) => t.id === type)!.hint}
          className="w-full bg-transparent outline-none font-urbanist font-bold text-white text-base placeholder:text-[#666] placeholder:font-normal"
        />
      </div>
      <div className="bg-[#2A2A2A] rounded-[16px] px-4 py-3 mb-2">
        <label className="font-urbanist text-text-gray text-[10px] uppercase tracking-wider font-semibold">Alias (numéro enregistré auprès de l'établissement)</label>
        <div className="flex items-center gap-2">
          <select
            value={country}
            aria-label="Pays"
            onChange={(e) => {
              setCountry(e.target.value as CountryCode);
              setDigits("");
              setLookup("idle");
            }}
            className="bg-transparent text-white font-urbanist font-bold text-base outline-none"
          >
            {COUNTRIES.map((k) => (
              <option key={k.code} value={k.code} className="text-card-dark">
                {k.code} +{k.dial}
              </option>
            ))}
          </select>
          <input
            inputMode="numeric"
            value={formatNationalNumber(digits, c.digits)}
            onChange={(e) => {
              setDigits(e.target.value.replace(/\D/g, "").slice(0, c.digits));
              setLookup("idle");
            }}
            placeholder={c.example}
            className="flex-1 min-w-0 bg-transparent outline-none font-urbanist font-bold text-white text-base placeholder:text-[#666]"
          />
        </div>
      </div>
      <button
        onClick={() => setDigits(user.phone.replace(/\D/g, "").slice(COUNTRY_MAP[user.country].dial.length))}
        className="font-urbanist text-yellow text-xs mb-4 press-scale"
        hidden={country !== user.country}
      >
        Utiliser mon numéro ({user.phone})
      </button>

      {lookup === "found" ? (
        <div className="bg-gain/15 rounded-[16px] p-3 mb-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-gain shrink-0" />
          <div className="font-urbanist text-xs text-white">
            Titulaire : <b>{user.name}</b> — correspond à votre identité.
            <div className="text-text-gray text-[10px] mt-0.5">Démo : résolution d'alias simulée.</div>
          </div>
        </div>
      ) : (
        <p className="font-urbanist text-text-gray text-[11px] mb-4">
          Le compte doit être à votre nom : PI-SPI renvoie le nom du titulaire et nous le comparons à votre identité.
        </p>
      )}

      {lookup !== "found" ? (
        <PrimaryButton disabled={!validNumber || institution.trim().length < 2 || lookup === "loading"} onClick={resolve}>
          {lookup === "loading" ? <Loader2 size={18} className="animate-spin" /> : null}
          VÉRIFIER L'ALIAS
        </PrimaryButton>
      ) : (
        <PrimaryButton disabled={duplicate} onClick={add}>
          {duplicate ? "COMPTE DÉJÀ AJOUTÉ" : "AJOUTER CE COMPTE"}
        </PrimaryButton>
      )}
    </Sheet>
  );
}
