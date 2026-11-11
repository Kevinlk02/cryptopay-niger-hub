import { useEffect, useRef, useState } from "react";
import { ChevronDown, MessageCircle, Mail, Phone, Send, Ticket } from "lucide-react";
import { toast } from "sonner";
import { SUPPORT } from "@/lib/config";
import { uid, useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { Chip, PrimaryButton, Sheet, TopBar } from "@/components/kit";

const FAQ = [
  { q: "Comment acheter des cryptos ?", a: "Touchez « Acheter » ou le bouton jaune +, choisissez la crypto et le montant en FCFA, puis le compte qui paie (banque, wallet Mobile Money ou microfinance, dans n'importe quel pays de l'UEMOA). Une demande de paiement PI-SPI arrive dans l'application de votre établissement : validez-la et la crypto est créditée en quelques secondes. Vous pouvez aussi payer en scannant un QR code PI-SPI." },
  { q: "Quels sont les frais ?", a: "1,5 % de commission à l'achat + les frais du prestataire PI-SPI partenaire (et ceux éventuels de votre établissement). Les envois vers Binance, OKX ou un autre wallet coûtent 0,5 % + les frais du réseau blockchain. Les envois entre utilisateurs CryptoPay (@nom) sont gratuits. Voir CGU & Légal → Grille tarifaire." },
  { q: "Comment envoyer vers Binance ?", a: "Sur Binance : Portefeuille → Déposer → choisissez la crypto et le réseau, copiez l'adresse. Dans CryptoPay : Envoyer → Binance, collez l'adresse en choisissant le MÊME réseau (ex. USDT en TRC-20). L'adresse est mémorisée pour la prochaine fois." },
  { q: "Qu'est-ce que PI-SPI ?", a: "C'est la plateforme de paiement instantané de la BCEAO. Elle relie les banques, les wallets Mobile Money et les institutions de microfinance des 8 pays de l'UEMOA. Un paiement arrive en quelques secondes, 24h/24, et il est irrévocable une fois confirmé. Votre numéro de téléphone sert d'alias." },
  { q: "Pourquoi vérifier mon identité ?", a: "La réglementation (BCEAO, CENTIF, GAFI) impose la vérification d'identité. Sans KYC vous êtes limité à 10 000 FCFA/jour. Avec une CNI ou un passeport + selfie, vous passez à 100 000 FCFA/jour. La vérification prend 24 à 48 h." },
  { q: "J'ai oublié mon PIN, que faire ?", a: "Sur l'écran de déverrouillage, touchez « PIN oublié ? ». Un code SMS est envoyé à votre numéro pour vous permettre de créer un nouveau PIN. Ne communiquez jamais votre PIN : CryptoPay ne vous le demandera jamais." },
];

function watHour() {
  return (new Date().getUTCHours() + 1) % 24;
}

function ChatSheet({ onClose }: { onClose: () => void }) {
  const { state, update } = useApp();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const open = watHour() >= 8 && watHour() < 20;
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [state.chat.length]);

  const send = () => {
    const msg = text.trim();
    if (!msg) return;
    setText("");
    update((s) => ({ ...s, chat: [...s.chat, { from: "user", text: msg, ts: Date.now() }] }));
    setTimeout(() => {
      update((s) => ({
        ...s,
        chat: [
          ...s.chat,
          {
            from: "agent",
            text: open
              ? "Merci pour votre message ! Un conseiller CryptoPay vous répond dans quelques minutes. (Démo : réponse automatique)"
              : `Notre équipe est disponible de ${SUPPORT.hours}. Nous vous répondrons dès la réouverture.`,
            ts: Date.now(),
          },
        ],
      }));
    }, 900);
  };

  return (
    <Sheet onClose={onClose} title="Chat en direct">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${open ? "bg-gain" : "bg-[#666]"}`} />
        <span className="font-urbanist text-text-gray text-xs">{open ? "En ligne" : "Hors ligne"} · {SUPPORT.hours}</span>
      </div>
      <div className="h-64 overflow-y-auto no-scrollbar space-y-2 mb-3 bg-[#111] rounded-[16px] p-3">
        {state.chat.length === 0 && <p className="font-urbanist text-text-gray text-xs text-center pt-20">Posez votre question, nous sommes là pour vous aider.</p>}
        {state.chat.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-[16px] px-3 py-2 font-urbanist text-[13px] ${m.from === "user" ? "ml-auto bg-yellow text-card-dark" : "bg-[#2A2A2A] text-white"}`}>
            {m.text}
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Votre message…"
          className="flex-1 bg-[#2A2A2A] rounded-full px-4 h-11 outline-none font-urbanist text-white text-sm placeholder:text-text-gray"
        />
        <button onClick={send} aria-label="Envoyer" className="press-scale w-11 h-11 rounded-full bg-yellow flex items-center justify-center">
          <Send size={16} className="text-card-dark" />
        </button>
      </div>
    </Sheet>
  );
}

function TicketSheet({ onClose }: { onClose: () => void }) {
  const { update } = useApp();
  const [subject, setSubject] = useState("Transaction");
  const [message, setMessage] = useState("");
  const submit = () => {
    update((s) => ({ ...s, tickets: [{ id: uid(), subject, message: message.trim(), ts: Date.now(), status: "Ouvert" }, ...s.tickets] }));
    toast.success("Ticket créé", { description: "Réponse par SMS sous 24 h ouvrées." });
    onClose();
  };
  return (
    <Sheet onClose={onClose} title="Nouveau ticket">
      <div className="flex gap-2 flex-wrap mb-3">
        {["Transaction", "Compte", "KYC", "Autre"].map((s) => (
          <Chip key={s} onDark active={subject === s} onClick={() => setSubject(s)}>
            {s}
          </Chip>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
        rows={5}
        placeholder="Décrivez votre problème (référence de transaction si possible)…"
        className="w-full bg-[#2A2A2A] rounded-[16px] p-4 outline-none font-urbanist text-white text-sm placeholder:text-text-gray mb-4 resize-none"
      />
      <PrimaryButton disabled={message.trim().length < 10} onClick={submit}>
        ENVOYER LE TICKET
      </PrimaryButton>
    </Sheet>
  );
}

export default function SupportScreen() {
  const { state } = useApp();
  const { back } = useNav();
  const [open, setOpen] = useState<number | null>(0);
  const [sheet, setSheet] = useState<null | "chat" | "ticket">(null);

  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Aide & Support" onBack={back} />

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setSheet("chat")} className="press-scale bg-card-dark rounded-[20px] p-4 text-left">
          <MessageCircle size={20} className="text-yellow mb-2" />
          <div className="font-urbanist font-bold text-white text-sm">Chat en direct</div>
          <div className="font-urbanist text-text-gray text-[11px]">{SUPPORT.hours}</div>
        </button>
        <button onClick={() => setSheet("ticket")} className="press-scale bg-card-dark rounded-[20px] p-4 text-left">
          <Ticket size={20} className="text-yellow mb-2" />
          <div className="font-urbanist font-bold text-white text-sm">Ouvrir un ticket</div>
          <div className="font-urbanist text-text-gray text-[11px]">Réponse sous 24 h</div>
        </button>
      </div>

      <div className="font-urbanist font-bold text-card-dark text-sm pt-1">Questions fréquentes</div>
      <div className="space-y-2">
        {FAQ.map((f, i) => (
          <div key={i} className="bg-white rounded-[20px] overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full p-4 flex items-center gap-3 text-left press-scale" aria-expanded={open === i}>
              <span className="flex-1 font-urbanist font-semibold text-card-dark text-sm">{f.q}</span>
              <ChevronDown size={16} className={`text-text-gray transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <p className="px-4 pb-4 font-urbanist text-[#555] text-[13px] leading-relaxed">{f.a}</p>}
          </div>
        ))}
      </div>

      {state.tickets.length > 0 && (
        <>
          <div className="font-urbanist font-bold text-card-dark text-sm pt-1">Mes tickets</div>
          <div className="space-y-2">
            {state.tickets.map((t) => (
              <div key={t.id} className="bg-white rounded-[20px] p-4">
                <div className="flex justify-between mb-1">
                  <span className="font-urbanist font-bold text-card-dark text-sm">{t.subject}</span>
                  <span className="font-urbanist font-bold text-[10px] bg-yellow text-card-dark px-2 py-0.5 rounded-full">{t.status}</span>
                </div>
                <p className="font-urbanist text-text-gray text-xs line-clamp-2">{t.message}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="font-urbanist font-bold text-card-dark text-sm pt-1">Contact direct</div>
      <div className="bg-white rounded-[20px] p-4 space-y-3">
        <a href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 font-urbanist text-card-dark text-sm">
          <Phone size={16} /> {SUPPORT.phone}
        </a>
        <a href={`mailto:${SUPPORT.email}`} className="flex items-center gap-3 font-urbanist text-card-dark text-sm">
          <Mail size={16} /> {SUPPORT.email}
        </a>
        {SUPPORT.whatsapp && (
          <a href={`https://wa.me/${SUPPORT.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 font-urbanist text-card-dark text-sm">
            <MessageCircle size={16} /> WhatsApp {SUPPORT.whatsapp}
          </a>
        )}
        <p className="font-urbanist text-text-gray text-[10px]">Coordonnées provisoires, à définir avant lancement.</p>
      </div>

      {sheet === "chat" && <ChatSheet onClose={() => setSheet(null)} />}
      {sheet === "ticket" && <TicketSheet onClose={() => setSheet(null)} />}
    </div>
  );
}
