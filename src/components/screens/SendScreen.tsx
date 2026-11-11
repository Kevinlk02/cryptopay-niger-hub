import { useCallback, useMemo, useState } from "react";
import { QrCode, Clipboard, Users, CheckCircle2, AlertCircle, ShieldAlert, Check } from "lucide-react";
import { toast } from "sonner";
import { ASSETS, ASSET_MAP, NETWORKS, findLookalike, validateAddress, type AssetSymbol, type NetworkId } from "@/lib/assets";
import { FEES, LARGE_SEND_FCFA } from "@/lib/config";
import { formatCrypto, formatMoney, shortAddress } from "@/lib/format";
import { useApp, type SavedAddress } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { usePrices } from "@/hooks/usePrices";
import { Chip, CoinIcon, InfoNote, PinPrompt, PrimaryButton, Sheet, SuccessOverlay, SummaryRows, TopBar } from "@/components/kit";
import { QrScanner } from "@/components/kit/QrScanner";

const PLATFORMS = ["Binance", "OKX", "Mon Wallet", "Autre"] as const;
type Platform = (typeof PLATFORMS)[number];

export default function SendScreen({ initialAsset }: { initialAsset?: AssetSymbol }) {
  const { state, update, t, addTransaction, adjustHolding, remainingAllowance } = useApp();
  const { back, go } = useNav();
  const { prices } = usePrices();
  const held = ASSETS.filter((a) => (state.holdings[a.symbol] ?? 0) > 0);
  const [asset, setAsset] = useState<AssetSymbol>(initialAsset ?? held[0]?.symbol ?? "USDT");
  const [network, setNetwork] = useState<NetworkId>(ASSET_MAP[initialAsset ?? held[0]?.symbol ?? "USDT"].networks[0].id);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [sheet, setSheet] = useState<null | "asset" | "contacts" | "scan" | "confirm" | "pin">(null);
  const [done, setDone] = useState(false);
  const [scamCheck, setScamCheck] = useState(false);

  const user = state.user!;
  const meta = ASSET_MAP[asset];
  const balance = state.holdings[asset] ?? 0;
  const numAmount = parseFloat(amount.replace(",", ".")) || 0;
  const check = validateAddress(address, network);
  const internal = check.ok && check.kind === "internal";
  const networkFee = internal ? 0 : meta.networks.find((n) => n.id === network)!.fee;
  const platformFee = internal ? 0 : numAmount * FEES.externalWithdraw;
  const fee = networkFee + platformFee;
  const total = numAmount + fee;
  const valueFCFA = numAmount * prices[asset].fcfa;
  const insufficient = total > balance + 1e-12;
  const overLimit = !internal && valueFCFA > remainingAllowance;
  const self = address.trim().toLowerCase() === user.handle.toLowerCase() || address.replace(/\s/g, "") === user.phone.replace(/\s/g, "");

  // ── Protections anti-arnaque ──
  const known = useMemo(
    () => [...new Set([...state.transactions.filter((t) => t.type === "send").map((t) => t.counterparty), ...state.savedAddresses.map((a) => a.address)])],
    [state.transactions, state.savedAddresses],
  );
  const trimmed = address.trim();
  const lookalike = !internal && check.ok ? findLookalike(trimmed, known) : null;
  const firstTime = !internal && check.ok && !known.includes(trimmed);
  const frozen = state.withdrawalsFrozen && !internal;
  const wl = state.whitelist.find((w) => w.address === trimmed && w.network === network);
  const wlBlocked = state.whitelistEnabled && !internal && check.ok && (!wl || wl.activeAt > Date.now());
  const large = valueFCFA >= LARGE_SEND_FCFA;
  const canSend = check.ok && numAmount > 0 && !insufficient && !overLimit && !self && !frozen && !wlBlocked;

  const selectAsset = (s: AssetSymbol) => {
    setAsset(s);
    setNetwork(ASSET_MAP[s].networks[0].id);
    setSheet(null);
    setAmount("");
    applyPlatform(platform, s, ASSET_MAP[s].networks[0].id);
  };

  const saved = (label: string, a = asset, n = network) => state.savedAddresses.find((s) => s.label === label && s.asset === a && s.network === n);

  const applyPlatform = (p: Platform | null, a = asset, n = network) => {
    setPlatform(p);
    if (!p || p === "Autre") return;
    const s = saved(p, a, n);
    setAddress(s?.address ?? "");
    if (!s) {
      toast(`Collez votre adresse de dépôt ${p}`, {
        description: p === "Mon Wallet" ? "Adresse de votre wallet personnel, elle sera mémorisée." : `${p} → Portefeuille → Déposer → ${a} → réseau ${NETWORKS[n].label}`,
      });
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddress(text.trim());
    } catch {
      toast.error("Impossible de lire le presse-papiers");
    }
  };

  const setMax = () => {
    const pf = internal ? 0 : 1 + FEES.externalWithdraw;
    const max = internal ? balance : Math.max(0, (balance - networkFee) / pf);
    setAmount(String(Number(max.toFixed(meta.decimals))));
  };

  const recents = useMemo(() => {
    const fromTx = state.transactions
      .filter((t) => t.type === "send" && t.counterparty && (t.counterparty.startsWith("@") || t.counterparty.length > 20))
      .map((t) => ({ label: "Récent", asset: t.asset, network: t.network ?? ASSET_MAP[t.asset].networks[0].id, address: t.counterparty }));
    const all: SavedAddress[] = [...state.savedAddresses, ...fromTx];
    return all.filter((r, i) => all.findIndex((x) => x.address === r.address) === i);
  }, [state.savedAddresses, state.transactions]);

  const onScan = useCallback((a: string) => {
    setAddress(a);
    setSheet(null);
  }, []);

  const execute = () => {
    setSheet(null);
    adjustHolding(asset, -total);
    const counterparty = internal ? address.trim() : platform && platform !== "Autre" ? platform : address.trim();
    addTransaction({
      type: "send",
      asset,
      amount: numAmount,
      fcfa: Math.round(valueFCFA),
      feeFCFA: Math.round(fee * prices[asset].fcfa),
      counterparty,
      network: internal ? undefined : network,
      countsForLimits: !internal,
    });
    if (platform && platform !== "Autre" && !internal && !saved(platform)) {
      update((s) => ({ ...s, savedAddresses: [...s.savedAddresses, { label: platform, asset, network, address: address.trim() }] }));
    }
    setDone(true);
  };

  if (done) {
    return (
      <SuccessOverlay
        title="Envoi effectué !"
        subtitle={`-${formatCrypto(numAmount, asset)}`}
        detail={internal ? `Vers ${address}` : `Vers ${shortAddress(address)} · confirmation blockchain en cours`}
        onDone={() => go({ name: "home" })}
      />
    );
  }

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4 relative">
      <TopBar
        title={t("send.title")}
        onBack={back}
        right={
          <button onClick={() => setSheet("asset")} className="press-scale bg-yellow px-3 py-1.5 rounded-full font-urbanist font-bold text-card-dark text-sm">
            {asset} ▾
          </button>
        }
      />

      {held.length === 0 && <InfoNote>Vous n'avez encore aucun actif à envoyer. Achetez d'abord des cryptos.</InfoNote>}

      {/* Réseau */}
      {meta.networks.length > 1 && (
        <div className="flex gap-2 items-center">
          <span className="font-urbanist text-text-gray text-xs mr-1">Réseau</span>
          {meta.networks.map((n) => (
            <Chip
              key={n.id}
              active={network === n.id}
              onClick={() => {
                setNetwork(n.id);
                applyPlatform(platform, asset, n.id);
              }}
            >
              {NETWORKS[n.id].label}
            </Chip>
          ))}
        </div>
      )}

      {/* Destinataire */}
      <div className="bg-card-dark rounded-[20px] p-4">
        <div className="font-urbanist font-semibold text-text-gray text-[10px] uppercase tracking-wider mb-2">Destinataire</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Adresse ${NETWORKS[network].label}, @utilisateur ou +numéro`}
            value={address}
            onChange={(e) => setAddress(e.target.value.trim())}
            spellCheck={false}
            autoCapitalize="off"
            className="flex-1 min-w-0 bg-transparent text-white font-urbanist font-medium text-sm placeholder:text-text-gray outline-none"
          />
          <div className="flex gap-1.5">
            {[
              { Icon: QrCode, label: "Scanner", fn: () => setSheet("scan") },
              { Icon: Clipboard, label: "Coller", fn: paste },
              { Icon: Users, label: "Contacts", fn: () => setSheet("contacts") },
            ].map(({ Icon, label, fn }) => (
              <button key={label} onClick={fn} aria-label={label} className="press-scale w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <Icon size={14} className="text-white" />
              </button>
            ))}
          </div>
        </div>
        {address && (
          <div className={`flex items-center gap-1.5 mt-3 font-urbanist text-[11px] font-semibold ${check.ok && !self ? "text-gain" : "text-loss"}`}>
            {check.ok && !self ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {self ? "Vous ne pouvez pas vous envoyer des fonds" : check.ok ? (internal ? "Utilisateur CryptoPay · envoi gratuit et instantané" : `Adresse ${NETWORKS[network].label} valide`) : "reason" in check ? check.reason : ""}
          </div>
        )}
      </div>

      {lookalike && (
        <InfoNote tone="red">
          <b>Attention, adresse piégée possible.</b> Elle ressemble à une adresse déjà utilisée ({shortAddress(lookalike)}) mais elle est différente. Les escrocs créent des adresses
          presque identiques : recopiez l'adresse depuis la source officielle.
        </InfoNote>
      )}
      {firstTime && !lookalike && <InfoNote>Première fois que vous envoyez à cette adresse : vérifiez-la caractère par caractère.</InfoNote>}
      {frozen && (
        <InfoNote tone="red">
          Vos retraits externes sont gelés.{" "}
          <button onClick={() => go({ name: "security" })} className="font-bold underline">
            Gérer dans Sécurité
          </button>
        </InfoNote>
      )}
      {wlBlocked && (
        <InfoNote tone="red">
          {wl ? `Adresse en liste blanche, utilisable à partir du ${new Date(wl.activeAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}.` : "Liste blanche activée : cette adresse n'y figure pas."}{" "}
          <button onClick={() => go({ name: "security" })} className="font-bold underline">
            Gérer la liste blanche
          </button>
        </InfoNote>
      )}

      {/* Raccourcis plateformes */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {PLATFORMS.map((p) => (
          <Chip key={p} active={platform === p} onClick={() => applyPlatform(p)}>
            {p}
            {p !== "Autre" && saved(p) ? " ✓" : ""}
          </Chip>
        ))}
      </div>

      {/* Montant */}
      <div className="bg-white rounded-[20px] p-4 text-center relative">
        <button onClick={setMax} className="absolute top-3 right-3 bg-yellow text-card-dark font-urbanist font-bold text-[11px] px-2.5 py-0.5 rounded-full press-scale">
          MAX
        </button>
        <div className="flex items-baseline justify-center gap-2 mt-3">
          <input
            inputMode="decimal"
            aria-label="Montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="0"
            className="font-urbanist font-black text-card-dark text-4xl text-right bg-transparent outline-none w-[60%] placeholder:text-[#C8C3BA]"
          />
          <span className="font-urbanist font-semibold text-card-dark text-2xl text-left w-[40%]">{asset}</span>
        </div>
        <div className="font-urbanist text-text-gray text-[13px] mt-1">= {formatMoney(valueFCFA, user.currency)}</div>
        <div className="font-urbanist text-text-gray text-[11px] mt-1">Disponible : {formatCrypto(balance, asset)}</div>
      </div>

      {insufficient && numAmount > 0 && <InfoNote tone="red">Solde insuffisant (frais inclus).</InfoNote>}
      {overLimit && (
        <InfoNote tone="red">
          Plafond KYC dépassé.{" "}
          <button onClick={() => go({ name: "kyc" })} className="font-bold underline">
            Augmenter mon plafond
          </button>
        </InfoNote>
      )}

      {/* Frais réseau */}
      <div className="flex items-center justify-between">
        <span className="font-urbanist text-text-gray text-xs">Frais de réseau estimés{internal ? "" : ` (${NETWORKS[network].label})`}</span>
        <span className="font-urbanist font-semibold text-card-dark text-[13px]">{internal ? "Gratuit" : formatCrypto(networkFee, asset)}</span>
      </div>

      {/* Récapitulatif */}
      <div className="bg-card-dark rounded-[20px] p-4">
        <SummaryRows
          rows={[
            ["De", "Portefeuille principal"],
            ["Vers", address ? (internal ? address : shortAddress(address)) : "——"],
            ["Montant", formatCrypto(numAmount, asset)],
            ["Frais", internal ? "0" : `${formatCrypto(fee, asset)} (réseau + 0,5 %)`],
            ["Total", formatCrypto(total, asset)],
          ]}
        />
      </div>

      <PrimaryButton disabled={!canSend} onClick={() => setSheet("confirm")}>
        ENVOYER MAINTENANT
      </PrimaryButton>

      {sheet === "asset" && (
        <Sheet onClose={() => setSheet(null)} title="Actif à envoyer">
          <div className="space-y-1">
            {ASSETS.map((a) => (
              <button key={a.symbol} onClick={() => selectAsset(a.symbol)} className="press-scale w-full flex items-center gap-3 p-3 rounded-[16px] hover:bg-[#2A2A2A]">
                <CoinIcon symbol={a.symbol} />
                <div className="flex-1 text-left">
                  <div className="font-urbanist font-bold text-white text-sm">{a.name}</div>
                  <div className="font-urbanist text-text-gray text-[11px]">{formatCrypto(state.holdings[a.symbol] ?? 0, a.symbol)}</div>
                </div>
                {asset === a.symbol && <span className="text-yellow text-lg">✓</span>}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === "contacts" && (
        <Sheet onClose={() => setSheet(null)} title="Destinataires">
          {recents.length === 0 ? (
            <p className="font-urbanist text-text-gray text-sm text-center py-6">Aucun destinataire enregistré pour l'instant.</p>
          ) : (
            <div className="space-y-1">
              {recents.map((r) => (
                <button
                  key={r.address}
                  onClick={() => {
                    setAsset(r.asset);
                    setNetwork(r.network);
                    setAddress(r.address);
                    setPlatform(null);
                    setSheet(null);
                  }}
                  className="press-scale w-full flex items-center gap-3 p-3 rounded-[16px] hover:bg-[#2A2A2A] text-left"
                >
                  <CoinIcon symbol={r.asset} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="font-urbanist font-bold text-white text-sm">{r.label}</div>
                    <div className="font-urbanist text-text-gray text-[11px] truncate">
                      {shortAddress(r.address)} · {NETWORKS[r.network].label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Sheet>
      )}

      {sheet === "scan" && <QrScanner onResult={onScan} onClose={() => setSheet(null)} />}

      {sheet === "confirm" && (
        <Sheet onClose={() => setSheet(null)} title="Confirmer l'envoi">
          <div className="mb-5">
            <SummaryRows
              rows={[
                ["Vers", address],
                ["Réseau", internal ? "Interne CryptoPay" : NETWORKS[network].label],
                ["Montant", formatCrypto(numAmount, asset)],
                ["Frais", formatCrypto(fee, asset)],
                ["Total", formatCrypto(total, asset)],
              ]}
            />
          </div>
          {!internal && (
            <p className="font-urbanist text-yellow text-[11px] mb-4">⚠ Vérifiez l'adresse et le réseau : un envoi sur la blockchain est irréversible.</p>
          )}
          {large && (
            <button onClick={() => setScamCheck(!scamCheck)} className="w-full flex items-start gap-3 bg-[#2A2A2A] rounded-[16px] p-3 mb-4 text-left">
              <div className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center mt-0.5 ${scamCheck ? "bg-yellow" : "border-2 border-[#666]"}`}>
                {scamCheck && <Check size={12} className="text-card-dark" strokeWidth={3} />}
              </div>
              <span className="font-urbanist text-white text-xs leading-relaxed">
                <ShieldAlert size={13} className="inline text-yellow mr-1 -mt-0.5" />
                Personne ne m'a demandé d'envoyer ces fonds (faux agent du support, « investissement » qui double l'argent, inconnu sur WhatsApp…).
              </span>
            </button>
          )}
          <PrimaryButton disabled={large && !scamCheck} onClick={() => setSheet("pin")}>
            CONFIRMER L'ENVOI
          </PrimaryButton>
        </Sheet>
      )}
      {sheet === "pin" && <PinPrompt onClose={() => setSheet(null)} onSuccess={execute} />}
    </div>
  );
}
