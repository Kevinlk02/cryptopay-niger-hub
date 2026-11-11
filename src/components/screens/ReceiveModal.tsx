import { useState } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { ASSETS, ASSET_MAP, NETWORKS, demoAddress, type AssetSymbol, type NetworkId } from "@/lib/assets";
import { DEMO_MODE } from "@/lib/config";
import { formatCrypto } from "@/lib/format";
import { useApp } from "@/store/AppStore";
import { usePrices } from "@/hooks/usePrices";
import { Chip, PrimaryButton, Sheet } from "@/components/kit";

export default function ReceiveModal({ onClose, initialAsset }: { onClose: () => void; initialAsset?: AssetSymbol }) {
  const { state, t, addTransaction, adjustHolding } = useApp();
  const { prices } = usePrices();
  const [asset, setAsset] = useState<AssetSymbol>(initialAsset ?? "USDT");
  const [network, setNetwork] = useState<NetworkId>(ASSET_MAP[initialAsset ?? "USDT"].networks[0].id);
  const [copied, setCopied] = useState(false);
  const user = state.user!;
  const address = demoAddress(user.phone, network);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Adresse copiée");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible sur cet appareil");
    }
  };

  const share = async () => {
    const text = `Mon adresse ${asset} (${NETWORKS[network].label}) CryptoPay : ${address}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Adresse ${asset}`, text });
      } catch {
        /* partage annulé */
      }
    } else copy();
  };

  const simulateDeposit = () => {
    const amount = ASSET_MAP[asset].stable ? 25 : Number((15_000 / prices[asset].fcfa).toFixed(ASSET_MAP[asset].decimals));
    adjustHolding(asset, amount);
    addTransaction({ type: "receive", asset, amount, fcfa: Math.round(amount * prices[asset].fcfa), feeFCFA: 0, counterparty: "Externe", network, countsForLimits: false });
    toast.success(`Dépôt reçu : +${formatCrypto(amount, asset)}`);
    onClose();
  };

  return (
    <Sheet onClose={onClose} title={t("receive.title")}>
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {ASSETS.map((a) => (
          <Chip
            key={a.symbol}
            onDark
            active={asset === a.symbol}
            onClick={() => {
              setAsset(a.symbol);
              setNetwork(a.networks[0].id);
            }}
          >
            {a.symbol}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2 mb-5 items-center">
        <span className="font-urbanist text-text-gray text-xs mr-1">Réseau</span>
        {ASSET_MAP[asset].networks.map((n) => (
          <button
            key={n.id}
            onClick={() => setNetwork(n.id)}
            className={`press-scale px-3 py-1 rounded-full font-urbanist font-bold text-xs ${network === n.id ? "bg-white text-card-dark" : "bg-[#2A2A2A] text-white"}`}
          >
            {NETWORKS[n.id].label}
          </button>
        ))}
      </div>

      <div className="w-[208px] h-[208px] mx-auto bg-white rounded-[20px] flex items-center justify-center mb-4 p-3">
        <QRCodeSVG value={address} size={184} bgColor="#FFFFFF" fgColor="#1A1A1A" level="M" />
      </div>

      <div className="font-urbanist font-semibold text-white text-[12px] text-center mb-1 break-all px-2 select-all">{address}</div>
      <div className="font-urbanist text-text-gray text-[11px] text-center mb-4">
        ou recevez entre utilisateurs avec <b className="text-white">{user.handle}</b>
      </div>

      <div className="bg-yellow/10 rounded-[16px] p-3 mb-4 text-center">
        <span className="font-urbanist font-medium text-yellow text-xs">
          ⚠ Envoyez uniquement du {asset} via le réseau {NETWORKS[network].label}. Tout autre actif ou réseau sera perdu.
        </span>
      </div>

      <div className="space-y-3">
        <PrimaryButton onClick={copy}>
          {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copiée !" : "Copier l'adresse"}
        </PrimaryButton>
        <PrimaryButton variant="dark" onClick={share}>
          <Share2 size={18} /> Partager mon adresse
        </PrimaryButton>
      </div>

      {DEMO_MODE && (
        <button onClick={simulateDeposit} className="w-full mt-4 font-urbanist text-text-gray text-xs underline press-scale">
          Démo : simuler la réception d'un dépôt
        </button>
      )}
    </Sheet>
  );
}
