// Localisation : Français (complet), Haoussa et Zarma (CDC 4.1 & 9.2).
// ⚠ Les traductions haoussa et zarma sont PARTIELLES et doivent être relues
// par des locuteurs natifs avant lancement. Toute clé absente retombe sur le français.

export type Lang = "fr" | "ha" | "dje";

export const LANGS: { id: Lang; label: string; native: string }[] = [
  { id: "fr", label: "Français", native: "Français" },
  { id: "ha", label: "Haoussa", native: "Hausa" },
  { id: "dje", label: "Zarma", native: "Zarma" },
];

const fr = {
  "nav.home": "Accueil",
  "nav.market": "Marché",
  "nav.wallet": "Wallet",
  "nav.profile": "Profil",
  "action.buy": "Acheter",
  "action.send": "Envoyer",
  "action.receive": "Recevoir",
  "action.history": "Historique",
  "action.deposit": "Déposer",
  "action.withdraw": "Retirer",
  "action.swap": "Échanger",
  "action.continue": "CONTINUER →",
  "action.confirm": "Confirmer",
  "action.seeAll": "Tout voir",
  "action.logout": "Se déconnecter",
  "home.total": "Portefeuille total",
  "home.today": "AUJOURD'HUI",
  "home.quick": "Actions rapides",
  "home.assets": "Actifs",
  "home.empty": "Aucun actif pour l'instant. Achetez votre première crypto depuis votre banque ou votre Mobile Money.",
  "wallet.title": "Mon Wallet",
  "wallet.balance": "Solde total",
  "wallet.recent": "Transactions récentes",
  "market.title": "MARCHÉ",
  "market.search": "Rechercher des crypto-actifs",
  "buy.title": "ACHETER",
  "buy.method": "Moyen de paiement",
  "send.title": "Envoyer",
  "receive.title": "Recevoir",
  "profile.title": "Profil",
  "welcome": "Bienvenue",
  "start": "Commencer",
};

type Dict = Partial<Record<keyof typeof fr, string>>;

const ha: Dict = {
  "nav.home": "Gida",
  "nav.market": "Kasuwa",
  "nav.wallet": "Walat",
  "nav.profile": "Bayanai",
  "action.buy": "Saya",
  "action.send": "Aika",
  "action.receive": "Karɓa",
  "action.history": "Tarihi",
  "action.deposit": "Saka",
  "action.withdraw": "Cire",
  "action.swap": "Musanya",
  "action.continue": "CI GABA →",
  "action.confirm": "Tabbatar",
  "action.seeAll": "Duba duka",
  "action.logout": "Fita",
  "home.total": "Jimillar kuɗi",
  "home.quick": "Ayyuka masu sauri",
  "home.assets": "Kadarori",
  "market.title": "KASUWA",
  "market.search": "Nemi kuɗin kirifto",
  "buy.title": "SAYA",
  "send.title": "Aika",
  "receive.title": "Karɓa",
  "welcome": "Barka da zuwa",
  "start": "Fara",
};

const dje: Dict = {
  "nav.home": "Fu",
  "nav.market": "Habu",
  "action.buy": "Day",
  "action.send": "Sanba",
  "market.title": "HABU",
  "buy.title": "DAY",
  "send.title": "Sanba",
  "welcome": "Fofo",
};

export type TKey = keyof typeof fr;

const DICTS: Record<Lang, Dict> = { fr, ha, dje };

export function translate(lang: Lang, key: TKey): string {
  return DICTS[lang]?.[key] ?? fr[key];
}
