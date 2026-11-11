import { useState } from "react";
import { ListChecks, Snowflake, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ASSETS, NETWORKS, validateAddress, type NetworkId } from "@/lib/assets";
import { DEMO_MODE, WHITELIST_DELAY_MS } from "@/lib/config";
import { shortAddress } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { Chip, PinPrompt, PrimaryButton, Sheet, Toggle } from "@/components/kit";

const ALL_NETWORKS = [...new Set(ASSETS.flatMap((a) => a.networks.map((n) => n.id)))] as NetworkId[];

function AddEntrySheet({ onClose }: { onClose: () => void }) {
  const { update } = useApp();
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const check = validateAddress(address, network);
  const ok = check.ok && check.kind === "external" && label.trim().length >= 2;
  const add = () => {
    update((s) => ({ ...s, whitelist: [...s.whitelist, { address: address.trim(), network, label: label.trim(), activeAt: Date.now() + WHITELIST_DELAY_MS }] }));
    toast.success("Adresse ajoutée", { description: "Utilisable dans 24 h (délai de sécurité)." });
    onClose();
  };
  return (
    <Sheet onClose={onClose} title="Ajouter une adresse">
      <div className="flex gap-2 flex-wrap mb-3">
        {ALL_NETWORKS.map((n) => (
          <Chip key={n} onDark active={network === n} onClick={() => setNetwork(n)}>
            {NETWORKS[n].label}
          </Chip>
        ))}
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value.slice(0, 30))}
        placeholder="Nom (ex. Mon Binance)"
        className="w-full bg-[#2A2A2A] rounded-[16px] px-4 h-12 mb-2 outline-none font-urbanist text-white text-sm placeholder:text-text-gray"
      />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value.trim())}
        placeholder={`Adresse ${NETWORKS[network].label}`}
        spellCheck={false}
        className="w-full bg-[#2A2A2A] rounded-[16px] px-4 h-12 mb-2 outline-none font-urbanist text-white text-sm placeholder:text-text-gray"
      />
      {address && !check.ok && <p className="font-urbanist text-loss text-[11px] mb-2">{"reason" in check ? check.reason : ""}</p>}
      <p className="font-urbanist text-text-gray text-[11px] mb-4">
        Une nouvelle adresse n'est utilisable qu'après 24 h : si quelqu'un vole votre téléphone, il ne peut pas vider votre compte vers sa propre adresse.
      </p>
      <PrimaryButton disabled={!ok} onClick={add}>
        AJOUTER
      </PrimaryButton>
    </Sheet>
  );
}

/** Liste blanche d'adresses de retrait + gel d'urgence des retraits externes. */
export function WithdrawalProtection() {
  const { state, update } = useApp();
  const [sheet, setSheet] = useState<null | "add" | "unfreeze" | "disableWl">(null);

  const setFrozen = (v: boolean) => {
    if (v) {
      update((s) => ({ ...s, withdrawalsFrozen: true }));
      toast.success("Retraits gelés", { description: "Plus aucun envoi externe possible jusqu'au dégel." });
    } else setSheet("unfreeze");
  };

  return (
    <>
      <div className="bg-white rounded-[20px] p-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${state.withdrawalsFrozen ? "bg-loss" : "bg-card-dark"}`}>
            <Snowflake size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-urbanist font-semibold text-card-dark text-sm">Geler mes retraits</div>
            <div className="font-urbanist text-text-gray text-[11px]">Téléphone perdu ou doute ? Bloquez tout envoi externe en un geste.</div>
          </div>
          <Toggle checked={state.withdrawalsFrozen} onChange={setFrozen} label="Geler les retraits" />
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center">
            <ListChecks size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-urbanist font-semibold text-card-dark text-sm">Liste blanche d'adresses</div>
            <div className="font-urbanist text-text-gray text-[11px]">Envois externes uniquement vers vos adresses approuvées</div>
          </div>
          <Toggle
            checked={state.whitelistEnabled}
            onChange={(v) => (v ? update((s) => ({ ...s, whitelistEnabled: true })) : setSheet("disableWl"))}
            label="Liste blanche"
          />
        </div>
        {state.whitelistEnabled && (
          <div className="mt-3 space-y-2">
            {state.whitelist.map((w) => {
              const pending = w.activeAt > Date.now();
              return (
                <div key={w.address + w.network} className="flex items-center gap-2 bg-cream rounded-[14px] px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-urbanist font-semibold text-card-dark text-xs">
                      {w.label} · {NETWORKS[w.network].label}
                    </div>
                    <div className="font-urbanist text-text-gray text-[10px] truncate">{shortAddress(w.address)}</div>
                    {pending && (
                      <div className="font-urbanist text-[10px] text-card-dark font-semibold">
                        Active le {new Date(w.activeAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        {DEMO_MODE && (
                          <button
                            className="ml-2 underline"
                            onClick={() => update((s) => ({ ...s, whitelist: s.whitelist.map((x) => (x === w ? { ...x, activeAt: Date.now() } : x)) }))}
                          >
                            Démo : activer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button aria-label="Supprimer" onClick={() => update((s) => ({ ...s, whitelist: s.whitelist.filter((x) => x !== w) }))} className="press-scale">
                    <Trash2 size={14} className="text-loss" />
                  </button>
                </div>
              );
            })}
            <button onClick={() => setSheet("add")} className="press-scale w-full h-10 rounded-full bg-card-dark text-white font-urbanist font-bold text-xs">
              + Ajouter une adresse
            </button>
          </div>
        )}
      </div>

      {sheet === "add" && <AddEntrySheet onClose={() => setSheet(null)} />}
      {sheet === "unfreeze" && (
        <PinPrompt
          title="PIN pour dégeler les retraits"
          onClose={() => setSheet(null)}
          onSuccess={() => {
            update((s) => ({ ...s, withdrawalsFrozen: false }));
            setSheet(null);
            toast.success("Retraits dégelés");
          }}
        />
      )}
      {sheet === "disableWl" && (
        <PinPrompt
          title="PIN pour désactiver la liste blanche"
          onClose={() => setSheet(null)}
          onSuccess={() => {
            update((s) => ({ ...s, whitelistEnabled: false }));
            setSheet(null);
          }}
        />
      )}
    </>
  );
}
