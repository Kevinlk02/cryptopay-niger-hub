import { useState } from "react";
import { ArrowUp, ArrowDown, CreditCard, Download, Repeat, Banknote, Smartphone, Check, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { NETWORKS, isInternalRecipient } from "@/lib/assets";
import { SLA } from "@/lib/config";
import { formatCrypto, formatDate, formatMoney, shortAddress } from "@/lib/format";
import { uid, useApp, type Transaction, type TxType } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { Chip, PrimaryButton, Sheet, SummaryRows, TopBar } from "@/components/kit";

const LABEL: Record<TxType, string> = { buy: "Achat", sell: "Retrait", send: "Envoi", receive: "Réception", swap: "Échange", airtime: "Recharge" };
const PREP: Record<TxType, string> = { buy: "via", sell: "vers", send: "vers", receive: "de", swap: "vers", airtime: "pour" };

export function TxRow({ tx, onClick, hidden }: { tx: Transaction; onClick?: () => void; hidden?: boolean }) {
  const Icon = { send: ArrowUp, receive: ArrowDown, buy: CreditCard, sell: Banknote, swap: Repeat, airtime: Smartphone }[tx.type];
  const bg = { send: "bg-card-dark", receive: "bg-gain", buy: "bg-yellow", sell: "bg-card-dark", swap: "bg-[#E8E3D9]", airtime: "bg-card-dark" }[tx.type];
  const ic = tx.type === "buy" || tx.type === "swap" ? "text-card-dark" : "text-white";
  const sign = tx.type === "buy" || tx.type === "receive" ? "+" : tx.type === "swap" ? "" : "-";
  const color = tx.type === "receive" ? "text-gain" : tx.type === "buy" ? "text-card-dark" : tx.type === "swap" ? "text-card-dark" : "text-loss";
  const counterparty = tx.type === "swap" ? tx.toAsset : tx.counterparty.length > 20 ? shortAddress(tx.counterparty) : tx.counterparty;
  return (
    <button onClick={onClick} className="w-full bg-white rounded-[20px] p-4 flex items-center gap-3 press-scale text-left">
      <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={ic} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-urbanist font-bold text-card-dark text-sm">
          {LABEL[tx.type]} {tx.asset}
          {tx.status === "pending" && <span className="ml-2 text-[10px] bg-yellow px-1.5 py-0.5 rounded-full">En cours</span>}
        </div>
        <div className="font-urbanist text-text-gray text-[11px] truncate">
          {PREP[tx.type]} {counterparty} • {formatDate(tx.ts)}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-urbanist font-bold text-sm ${color}`}>{hidden ? "•••" : `${sign}${formatCrypto(tx.amount, tx.asset)}`}</div>
        <div className="font-urbanist text-text-gray text-[11px]">{hidden ? "" : formatMoney(tx.fcfa)}</div>
      </div>
    </button>
  );
}

/** Étapes de suivi d'une transaction (en production : statuts PI-SPI / confirmations blockchain). */
function timeline(tx: Transaction): { label: string; done: boolean }[] {
  const done = tx.status === "completed";
  switch (tx.type) {
    case "buy":
      return [
        { label: "Demande de paiement PI-SPI envoyée", done: true },
        { label: "Paiement confirmé (irrévocable)", done },
        { label: "Cryptos créditées", done },
      ];
    case "sell":
      return [
        { label: "Cryptos débitées au taux garanti", done: true },
        { label: "Paiement PI-SPI émis", done },
        { label: "Fonds reçus sur votre compte", done },
      ];
    case "send":
      return isInternalRecipient(tx.counterparty)
        ? [{ label: "Envoi interne CryptoPay", done: true }, { label: "Reçu par le destinataire", done }]
        : [
            { label: "Envoi signé (portefeuille sécurisé)", done: true },
            { label: "Diffusé sur la blockchain", done },
            { label: "Confirmé par le réseau", done },
          ];
    case "airtime":
      return [{ label: "Paiement en crypto", done: true }, { label: "Crédit livré par l'opérateur", done }];
    default:
      return [{ label: "Opération enregistrée", done: true }, { label: "Terminée", done }];
  }
}

const SLA_OF: Partial<Record<TxType, string>> = { buy: SLA.buy, sell: SLA.sell };

export function TxDetail({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const { update } = useApp();
  const [reported, setReported] = useState(false);
  const sla = tx.type === "send" ? (isInternalRecipient(tx.counterparty) ? SLA.sendInternal : SLA.sendExternal) : SLA_OF[tx.type];
  const report = () => {
    update((s) => ({
      ...s,
      tickets: [
        { id: uid(), subject: "Transaction", message: `Problème sur la transaction ${tx.id.toUpperCase().slice(0, 12)} (${LABEL[tx.type]} ${tx.asset}, ${new Date(tx.ts).toLocaleString("fr-FR")}).`, ts: Date.now(), status: "Ouvert" },
        ...s.tickets,
      ],
    }));
    setReported(true);
    toast.success("Signalement envoyé", { description: "Un conseiller vous répond sous 24 h. Suivi dans Aide & Support." });
  };
  const rows: [string, string][] = [
    ["Type", LABEL[tx.type]],
    ["Date", new Date(tx.ts).toLocaleString("fr-FR")],
    ["Statut", tx.status === "completed" ? "Terminée" : tx.status === "pending" ? "En cours" : "Échouée"],
    [tx.type === "buy" ? "Payé via" : tx.type === "receive" ? "De" : "Vers", tx.type === "swap" ? `${formatCrypto(tx.toAmount ?? 0, tx.toAsset!)}` : tx.counterparty],
  ];
  if (tx.network) rows.push(["Réseau", NETWORKS[tx.network].label]);
  rows.push(["Référence", tx.id.toUpperCase().slice(0, 12)], ["Frais", formatMoney(tx.feeFCFA)], ["Montant", `${formatCrypto(tx.amount, tx.asset)} · ${formatMoney(tx.fcfa)}`]);
  return (
    <Sheet onClose={onClose} title="Détail de la transaction">
      <div className="space-y-2.5 mb-5">
        {timeline(tx).map((st, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${st.done ? "bg-yellow" : "bg-[#2A2A2A]"}`}>
              {st.done && <Check size={11} className="text-card-dark" strokeWidth={3} />}
            </div>
            <span className={`font-urbanist text-sm ${st.done ? "text-white" : "text-text-gray"}`}>{st.label}</span>
          </div>
        ))}
        {sla && <p className="font-urbanist text-text-gray text-[11px] pl-8">Délai annoncé : {sla}</p>}
      </div>
      <SummaryRows rows={rows} />
      <div className="mt-5">
        <PrimaryButton variant="dark" disabled={reported} onClick={report}>
          <LifeBuoy size={16} /> {reported ? "Signalement envoyé" : "Signaler un problème"}
        </PrimaryButton>
      </div>
    </Sheet>
  );
}

function toCSV(txs: Transaction[]): string {
  const head = ["Date", "Type", "Actif", "Montant", "Valeur (FCFA)", "Frais (FCFA)", "Contrepartie", "Réseau", "Statut", "Référence"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = txs.map((t) =>
    [
      new Date(t.ts).toLocaleString("fr-FR"),
      LABEL[t.type],
      t.asset,
      String(t.amount).replace(".", ","),
      Math.round(t.fcfa),
      Math.round(t.feeFCFA),
      t.type === "swap" ? `${t.toAmount} ${t.toAsset}` : t.counterparty,
      t.network ? NETWORKS[t.network].label : "",
      t.status,
      t.id,
    ]
      .map(esc)
      .join(";"),
  );
  return "﻿" + [head.map(esc).join(";"), ...lines].join("\r\n");
}

const FILTERS: { id: "all" | TxType; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "buy", label: "Achats" },
  { id: "send", label: "Envois" },
  { id: "receive", label: "Réceptions" },
  { id: "sell", label: "Retraits" },
  { id: "swap", label: "Échanges" },
  { id: "airtime", label: "Recharges" },
];

export default function HistoryScreen() {
  const { state } = useApp();
  const { back } = useNav();
  const [filter, setFilter] = useState<"all" | TxType>("all");
  const [detail, setDetail] = useState<Transaction | null>(null);
  const list = state.transactions.filter((t) => filter === "all" || t.type === filter);

  const groups = list.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const k = new Date(tx.ts).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    (acc[k] ||= []).push(tx);
    return acc;
  }, {});

  const exportCSV = () => {
    if (list.length === 0) return toast("Aucune transaction à exporter");
    const blob = new Blob([toCSV(list)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cryptopay-historique-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${list.length} transaction(s) exportée(s)`);
  };

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar
        title="Historique"
        onBack={back}
        right={
          <button onClick={exportCSV} aria-label="Exporter en CSV" className="press-scale w-9 h-9 rounded-full bg-yellow flex items-center justify-center">
            <Download size={16} className="text-card-dark" />
          </button>
        }
      />
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>
      {list.length === 0 && <p className="font-urbanist text-text-gray text-sm text-center py-10">Aucune transaction</p>}
      {Object.entries(groups).map(([month, txs]) => (
        <div key={month}>
          <div className="font-urbanist font-bold text-text-gray text-xs uppercase tracking-wider mb-2">{month}</div>
          <div className="space-y-3">
            {txs.map((tx) => (
              <TxRow key={tx.id} tx={tx} onClick={() => setDetail(tx)} />
            ))}
          </div>
        </div>
      ))}
      {detail && <TxDetail tx={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
