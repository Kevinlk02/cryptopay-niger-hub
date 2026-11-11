import { useState } from "react";
import { Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { PrimaryButton, Sheet, TopBar } from "@/components/kit";
import { AddPayAccountSheet, PayAccountIcon } from "@/components/kit/PayAccounts";

export default function PayAccountsScreen() {
  const { state, update } = useApp();
  const { back } = useNav();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const accounts = state.user!.payAccounts;

  const remove = (id: string) => {
    update((s) => ({ ...s, user: s.user && { ...s.user, payAccounts: s.user.payAccounts.filter((a) => a.id !== id) } }));
    setRemoving(null);
    toast.success("Compte retiré");
  };

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Comptes PI-SPI" onBack={back} />

      <div className="bg-card-dark rounded-[20px] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} className="text-yellow" />
          <span className="font-urbanist font-bold text-white text-sm">Paiement instantané UEMOA</span>
        </div>
        <p className="font-urbanist text-text-gray text-xs leading-relaxed">
          PI-SPI relie les banques, les wallets Mobile Money et la microfinance des 8 pays de l'UEMOA. Payez ou recevez en quelques secondes, 24h/24, avec un simple alias (votre numéro).
        </p>
      </div>

      <div className="space-y-3">
        {accounts.map((a) => (
          <div key={a.id} className="bg-white rounded-[20px] p-4 flex items-center gap-3">
            <PayAccountIcon type={a.type} />
            <div className="flex-1 min-w-0">
              <div className="font-urbanist font-bold text-card-dark text-sm truncate">{a.institution}</div>
              <div className="font-urbanist text-text-gray text-[11px]">{a.alias}</div>
              <div className="font-urbanist text-gain text-[10px] font-semibold">Titulaire vérifié : {a.holder}</div>
            </div>
            <button aria-label="Retirer ce compte" onClick={() => setRemoving(a.id)} className="press-scale w-8 h-8 rounded-full bg-cream flex items-center justify-center">
              <Trash2 size={14} className="text-loss" />
            </button>
          </div>
        ))}
        {accounts.length === 0 && <p className="font-urbanist text-text-gray text-sm text-center py-4">Aucun compte lié.</p>}
      </div>

      <PrimaryButton onClick={() => setAdding(true)}>AJOUTER UN COMPTE</PrimaryButton>
      <p className="font-urbanist text-text-gray text-[10px] text-center">Seuls les comptes à votre nom sont acceptés.</p>

      {adding && <AddPayAccountSheet onClose={() => setAdding(false)} onAdded={() => setAdding(false)} />}
      {removing && (
        <Sheet onClose={() => setRemoving(null)} title="Retirer ce compte ?">
          <p className="font-urbanist text-white text-sm mb-5">Vous ne pourrez plus payer ni recevoir de retraits sur ce compte, sauf à l'ajouter à nouveau.</p>
          <PrimaryButton onClick={() => remove(removing)}>RETIRER</PrimaryButton>
        </Sheet>
      )}
    </div>
  );
}
