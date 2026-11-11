import { Copy, Gift, Share2 } from "lucide-react";
import { toast } from "sonner";
import { DEMO_MODE, REFERRAL } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { PrimaryButton, TopBar } from "@/components/kit";

export default function ReferralScreen() {
  const { state, update } = useApp();
  const { back } = useNav();
  const code = state.user!.handle.slice(1).replace(/\./g, "").toUpperCase().slice(0, 12);
  const link = `https://cryptopay-niger.example/i/${code}`;
  const message = `Rejoins-moi sur CryptoPay : achète de l'USDT ou du Bitcoin depuis ta banque ou ton Mobile Money, partout dans l'UEMOA. Code : ${code} — ${link}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "CryptoPay", text: message });
      } catch {
        /* annulé */
      }
    } else copy();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Invitation copiée");
    } catch {
      toast.error("Copie impossible");
    }
  };

  const earned = state.referralsInvited * REFERRAL.rewardFCFA;

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Parrainage" onBack={back} />
      <div className="bg-card-dark rounded-[20px] p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-yellow flex items-center justify-center mx-auto mb-4">
          <Gift size={26} className="text-card-dark" />
        </div>
        <h2 className="font-urbanist font-black text-white text-xl mb-2">Invitez vos proches</h2>
        <p className="font-urbanist text-text-gray text-sm">
          Vous et votre filleul recevez <b className="text-yellow">{formatMoney(REFERRAL.rewardFCFA)} en USDT</b> après son premier achat d'au moins {formatMoney(REFERRAL.minFirstBuyFCFA)}.
        </p>
        <div className="mt-5 bg-[#2A2A2A] rounded-[16px] py-3 font-urbanist font-black text-yellow text-2xl tracking-[0.2em]">{code}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[20px] p-4">
          <div className="font-urbanist text-text-gray text-[11px]">Filleuls actifs</div>
          <div className="font-urbanist font-black text-card-dark text-2xl">{state.referralsInvited}</div>
        </div>
        <div className="bg-white rounded-[20px] p-4">
          <div className="font-urbanist text-text-gray text-[11px]">Gains</div>
          <div className="font-urbanist font-black text-card-dark text-2xl">{formatMoney(earned)}</div>
        </div>
      </div>

      <PrimaryButton onClick={share}>
        <Share2 size={18} /> PARTAGER MON INVITATION
      </PrimaryButton>
      <PrimaryButton variant="ghost" onClick={copy}>
        <Copy size={18} /> Copier le message
      </PrimaryButton>
      {DEMO_MODE && (
        <button onClick={() => update((s) => ({ ...s, referralsInvited: s.referralsInvited + 1 }))} className="w-full font-urbanist text-text-gray text-xs underline">
          Démo : simuler un filleul
        </button>
      )}
      <p className="font-urbanist text-text-gray text-[10px] text-center">Offre provisoire, montant et conditions à valider. Lien d'invitation fictif.</p>
    </div>
  );
}
