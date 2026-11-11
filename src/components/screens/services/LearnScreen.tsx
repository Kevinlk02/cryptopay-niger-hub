import { useState } from "react";
import { BookOpen, Check, ChevronRight, X } from "lucide-react";
import { useApp } from "@/store/AppStore";
import { useNav } from "@/store/nav";
import { PrimaryButton, Sheet, TopBar } from "@/components/kit";

interface Lesson {
  id: string;
  title: string;
  minutes: number;
  body: string[];
  quiz: { q: string; options: string[]; answer: number; explain: string };
}

const LESSONS: Lesson[] = [
  {
    id: "scams",
    title: "Les 5 arnaques les plus courantes",
    minutes: 3,
    body: [
      "1. Le faux support : quelqu'un se présente comme « agent CryptoPay » sur WhatsApp ou Facebook et demande votre PIN ou un envoi « de vérification ». Notre support ne demande JAMAIS votre PIN ni de vous envoyer des fonds.",
      "2. Le « doublement » : un placement qui promet de doubler votre argent en quelques jours. Aucun investissement sérieux ne garantit un tel rendement.",
      "3. L'adresse piégée : l'escroc vous envoie une adresse qui ressemble à la vôtre (mêmes premiers et derniers caractères). CryptoPay vous alerte, mais vérifiez toujours l'adresse en entier.",
      "4. Le faux paiement P2P : un acheteur prétend avoir payé et montre une capture d'écran truquée. Avec CryptoPay, vous n'échangez jamais avec un inconnu : la contrepartie est CryptoPay.",
      "5. Le faux site ou la fausse application : vérifiez l'adresse du site et téléchargez l'application uniquement depuis les stores officiels.",
    ],
    quiz: {
      q: "Un « agent CryptoPay » vous demande votre PIN pour débloquer votre compte. Que faites-vous ?",
      options: ["Je lui donne mon PIN", "Je refuse et je signale via Aide & Support", "Je lui envoie 5 000 FCFA de vérification"],
      answer: 1,
      explain: "CryptoPay ne demande jamais votre PIN. Toute demande de ce type est une arnaque.",
    },
  },
  {
    id: "stablecoins",
    title: "C'est quoi un stablecoin ?",
    minutes: 2,
    body: [
      "Un stablecoin (USDT, USDC) est une crypto dont la valeur suit le dollar américain : 1 USDT ≈ 1 $ ≈ 600 FCFA.",
      "Il sert à épargner en dollars, à envoyer de l'argent à l'étranger rapidement ou à payer sur des plateformes internationales.",
      "Son prix bouge très peu, contrairement au Bitcoin. Il n'est pas sans risque pour autant : il dépend de la solidité de son émetteur.",
    ],
    quiz: {
      q: "Quelle crypto a le prix le plus stable ?",
      options: ["Bitcoin", "USDT", "Solana"],
      answer: 1,
      explain: "L'USDT suit le dollar : son prix varie très peu.",
    },
  },
  {
    id: "networks",
    title: "Choisir le bon réseau",
    minutes: 2,
    body: [
      "Une même crypto peut circuler sur plusieurs réseaux. L'USDT existe par exemple sur TRC-20 (Tron), ERC-20 (Ethereum) et BEP-20 (BNB Chain).",
      "Le réseau d'envoi doit être le même que celui de réception. Si vous envoyez de l'USDT en TRC-20 vers une adresse ERC-20, les fonds peuvent être perdus.",
      "TRC-20 est le moins cher pour l'USDT. Pour le Bitcoin, Lightning est instantané et presque gratuit.",
    ],
    quiz: {
      q: "Binance vous affiche une adresse de dépôt USDT en TRC-20. Quel réseau choisir dans CryptoPay ?",
      options: ["ERC-20", "TRC-20", "N'importe lequel"],
      answer: 1,
      explain: "Toujours le même réseau des deux côtés.",
    },
  },
  {
    id: "volatility",
    title: "Gérer la volatilité",
    minutes: 2,
    body: [
      "Le Bitcoin peut perdre ou gagner 10 % en une journée. N'investissez que l'argent dont vous n'avez pas besoin à court terme.",
      "L'achat programmé (un petit montant chaque semaine) permet de lisser les hausses et les baisses au lieu de tout acheter au mauvais moment.",
      "Gardez votre épargne de précaution en FCFA ou en stablecoin plutôt qu'en crypto volatile.",
    ],
    quiz: {
      q: "Quelle stratégie réduit le risque d'acheter au plus haut ?",
      options: ["Tout acheter d'un coup", "Acheter un petit montant régulièrement", "Emprunter pour acheter plus"],
      answer: 1,
      explain: "L'achat programmé lisse le prix moyen d'achat.",
    },
  },
  {
    id: "pispi",
    title: "Payer avec PI-SPI",
    minutes: 2,
    body: [
      "PI-SPI est le système de paiement instantané de la BCEAO. Il relie banques, wallets Mobile Money et microfinance des 8 pays de l'UEMOA.",
      "Quand vous achetez, CryptoPay envoie une demande de paiement à votre établissement : vous la validez dans votre application et l'argent arrive en quelques secondes, 24h/24.",
      "Un paiement PI-SPI confirmé est définitif : vérifiez toujours le montant avant de valider.",
    ],
    quiz: {
      q: "Un paiement PI-SPI confirmé peut-il être annulé ?",
      options: ["Oui, sous 48 h", "Non, il est irrévocable", "Seulement le week-end"],
      answer: 1,
      explain: "Une fois confirmé, le paiement est irrévocable.",
    },
  },
  {
    id: "security",
    title: "Protéger votre compte",
    minutes: 2,
    body: [
      "Activez la biométrie et la double authentification. Ne partagez jamais votre PIN.",
      "Activez la liste blanche : vos cryptos ne peuvent partir que vers vos adresses approuvées, et une nouvelle adresse n'est utilisable qu'après 24 h.",
      "Téléphone perdu ? Gelez vos retraits depuis Profil → Sécurité, puis contactez le support.",
    ],
    quiz: {
      q: "À quoi sert la liste blanche ?",
      options: ["À recevoir plus vite", "À n'autoriser les envois que vers mes adresses approuvées", "À payer moins de frais"],
      answer: 1,
      explain: "Même avec votre téléphone, un voleur ne peut pas envoyer vers sa propre adresse avant 24 h.",
    },
  },
];

function LessonSheet({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const { state, update } = useApp();
  const [choice, setChoice] = useState<number | null>(null);
  const correct = choice === lesson.quiz.answer;
  const done = state.lessonsDone.includes(lesson.id);
  const pick = (i: number) => {
    setChoice(i);
    if (i === lesson.quiz.answer && !done) update((s) => ({ ...s, lessonsDone: [...s.lessonsDone, lesson.id] }));
  };
  return (
    <Sheet onClose={onClose} title={lesson.title} light>
      <div className="space-y-3 mb-5">
        {lesson.body.map((p, i) => (
          <p key={i} className="font-urbanist text-[#444] text-[13px] leading-relaxed">
            {p}
          </p>
        ))}
      </div>
      <div className="bg-card-dark rounded-[20px] p-4">
        <div className="font-urbanist font-bold text-white text-sm mb-3">Quiz : {lesson.quiz.q}</div>
        <div className="space-y-2">
          {lesson.quiz.options.map((o, i) => {
            const picked = choice === i;
            const style = choice === null ? "bg-[#2A2A2A] text-white" : i === lesson.quiz.answer ? "bg-gain text-white" : picked ? "bg-loss text-white" : "bg-[#2A2A2A] text-text-gray";
            return (
              <button key={i} disabled={choice !== null && correct} onClick={() => pick(i)} className={`press-scale w-full rounded-[14px] px-3 py-2.5 text-left font-urbanist text-sm flex items-center gap-2 ${style}`}>
                {choice !== null && i === lesson.quiz.answer && <Check size={14} />}
                {picked && !correct && <X size={14} />}
                {o}
              </button>
            );
          })}
        </div>
        {choice !== null && <p className={`font-urbanist text-xs mt-3 ${correct ? "text-gain" : "text-yellow"}`}>{correct ? `Bravo ! ${lesson.quiz.explain}` : "Pas tout à fait, réessayez."}</p>}
      </div>
      {correct && (
        <div className="mt-4">
          <PrimaryButton onClick={onClose}>TERMINER</PrimaryButton>
        </div>
      )}
    </Sheet>
  );
}

export default function LearnScreen() {
  const { state } = useApp();
  const { back } = useNav();
  const [open, setOpen] = useState<Lesson | null>(null);
  const done = state.lessonsDone.length;
  return (
    <div className="screen-fade px-5 pb-24 pt-4 space-y-4">
      <TopBar title="Apprendre" onBack={back} />
      <div className="bg-card-dark rounded-[20px] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-urbanist font-bold text-white text-sm">Votre progression</span>
          <span className="font-urbanist font-black text-yellow text-lg">
            {done}/{LESSONS.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#3A3A3A] overflow-hidden">
          <div className="h-full bg-yellow rounded-full transition-all" style={{ width: `${(done / LESSONS.length) * 100}%` }} />
        </div>
      </div>
      <div className="space-y-3">
        {LESSONS.map((l) => {
          const ok = state.lessonsDone.includes(l.id);
          return (
            <button key={l.id} onClick={() => setOpen(l)} className="press-scale w-full bg-white rounded-[20px] p-4 flex items-center gap-3 text-left">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-gain" : "bg-card-dark"}`}>
                {ok ? <Check size={16} className="text-white" /> : <BookOpen size={16} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className="font-urbanist font-semibold text-card-dark text-sm">{l.title}</div>
                <div className="font-urbanist text-text-gray text-[11px]">{l.minutes} min · quiz</div>
              </div>
              <ChevronRight size={16} className="text-text-gray" />
            </button>
          );
        })}
      </div>
      {open && <LessonSheet lesson={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
