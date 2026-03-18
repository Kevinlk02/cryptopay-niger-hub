import { useState } from "react";
import { QrCode, ArrowUp, ArrowDown, CreditCard } from "lucide-react";
import { PORTFOLIO, TRANSACTIONS, formatNumber } from "@/lib/data";

export default function WalletScreen() {
  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <span className="font-urbanist font-extrabold text-card-dark text-xl">Mon Wallet</span>
        <div className="w-9 h-9 rounded-full bg-card-dark flex items-center justify-center press-scale">
          <QrCode size={18} className="text-white" />
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-card-dark rounded-2xl p-5">
        <div className="font-urbanist font-medium text-text-gray text-xs mb-1">Solde total</div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-urbanist font-black text-white text-5xl italic">{formatNumber(PORTFOLIO.totalFCFA)}</span>
          <span className="font-urbanist font-semibold text-white text-xl">FCFA</span>
        </div>
        <div className="flex gap-2">
          {["Déposer", "Retirer", "Échanger"].map((label) => (
            <button key={label} className="press-scale flex-1 h-10 rounded-full bg-yellow font-urbanist font-bold text-card-dark text-xs">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets */}
      <div className="space-y-3">
        {PORTFOLIO.assets.map((a) => (
          <div key={a.symbol} className="bg-white rounded-xl p-4 flex items-center justify-between press-scale">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: a.color }}>
                <span className="font-urbanist font-black text-white text-sm">{a.symbol[0]}</span>
              </div>
              <div>
                <div className="font-urbanist font-bold text-card-dark text-sm">{a.name}</div>
                <div className="font-urbanist font-normal text-text-gray text-[11px]">{a.network}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-urbanist font-bold text-card-dark text-sm">{a.amount} {a.symbol}</div>
              <div className="font-urbanist font-normal text-text-gray text-[11px]">{formatNumber(a.valueFCFA)} FCFA</div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div>
        <span className="font-urbanist font-extrabold text-card-dark text-sm mb-3 block">Transactions récentes</span>
        <div className="space-y-3">
          {TRANSACTIONS.map((tx, i) => {
            const Icon = tx.type === "send" ? ArrowUp : tx.type === "receive" ? ArrowDown : CreditCard;
            const bgColor = tx.type === "send" ? "bg-card-dark" : tx.type === "receive" ? "bg-gain" : "bg-yellow";
            const iconColor = tx.type === "send" ? "text-white" : tx.type === "receive" ? "text-white" : "text-card-dark";
            const amountColor = tx.color === "gain" ? "text-gain" : tx.color === "loss" ? "text-loss" : "text-yellow";
            return (
              <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 press-scale">
                <div className={`w-9 h-9 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
                  <Icon size={16} className={iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-urbanist font-bold text-card-dark text-sm">
                    {tx.type === "buy" ? "Achat" : tx.type === "send" ? "Envoi" : "Réception"} {tx.asset}
                  </div>
                  <div className="font-urbanist font-normal text-text-gray text-[11px]">
                    {tx.type === "buy" ? "via" : tx.type === "send" ? "vers" : "de"} {tx.via} • {tx.date}
                  </div>
                </div>
                <span className={`font-urbanist font-bold text-sm ${amountColor}`}>{tx.amount}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
