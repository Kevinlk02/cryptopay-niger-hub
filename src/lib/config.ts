// Paramètres métier — Cahier des Charges v2.0, révisé pour le rail PI-SPI (UEMOA)

/** Taux de conversion USD → FCFA utilisé par le CDC (section 3.1.2). */
export const USD_TO_FCFA = 600;
/** Parité fixe EUR → FCFA (XOF). */
export const EUR_TO_FCFA = 655.957;

export const FEES = {
  /** Commission d'achat (CDC 7.1) */
  buyCommission: 0.015,
  /** Spread de change FCFA/Crypto, appliqué au taux (CDC 7.1 : 0,5 % à 1 %) */
  spread: 0.0075,
  /** Frais de retrait externe (CDC 7.1 : 0,5 % + frais réseau) */
  externalWithdraw: 0.005,
  /** Commission de revente crypto → compte PI-SPI (hypothèse alignée sur l'achat) */
  sellCommission: 0.015,
  /** TVA sur frais de service (Niger 19 % — CDC 2.3.2 ; varie selon le pays) */
  vat: 0.19,
};

// ───────── Couverture UEMOA (8 pays, monnaie commune XOF) ─────────

export type CountryCode = "BJ" | "BF" | "CI" | "GW" | "ML" | "NE" | "SN" | "TG";

export interface Country {
  code: CountryCode;
  name: string;
  dial: string;
  /** Nombre de chiffres du numéro national */
  digits: number;
  /** Format des numéros mobiles (volontairement souple — à affiner) */
  pattern: RegExp;
  example: string;
}

export const COUNTRIES: Country[] = [
  { code: "BJ", name: "Bénin", dial: "229", digits: 10, pattern: /^01\d{8}$/, example: "01 90 00 00 00" },
  { code: "BF", name: "Burkina Faso", dial: "226", digits: 8, pattern: /^\d{8}$/, example: "70 00 00 00" },
  { code: "CI", name: "Côte d'Ivoire", dial: "225", digits: 10, pattern: /^0\d{9}$/, example: "07 00 00 00 00" },
  { code: "GW", name: "Guinée-Bissau", dial: "245", digits: 9, pattern: /^9\d{8}$/, example: "95 500 00 00" },
  { code: "ML", name: "Mali", dial: "223", digits: 8, pattern: /^\d{8}$/, example: "70 00 00 00" },
  { code: "NE", name: "Niger", dial: "227", digits: 8, pattern: /^[2-9]\d{7}$/, example: "90 00 00 00" },
  { code: "SN", name: "Sénégal", dial: "221", digits: 9, pattern: /^7\d{8}$/, example: "77 000 00 00" },
  { code: "TG", name: "Togo", dial: "228", digits: 8, pattern: /^[2-9]\d{7}$/, example: "90 00 00 00" },
];

export const COUNTRY_MAP = Object.fromEntries(COUNTRIES.map((c) => [c.code, c])) as Record<CountryCode, Country>;

/** Groupe les chiffres : « 90 12 34 56 » (8/10 chiffres) ou « 77 123 45 67 » (9 chiffres). */
export function formatNationalNumber(digits: string, totalDigits = digits.length): string {
  if (totalDigits === 9) {
    return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(" ");
  }
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export function formatIntlPhone(country: CountryCode, digits: string): string {
  return `+${COUNTRY_MAP[country].dial} ${formatNationalNumber(digits, COUNTRY_MAP[country].digits)}`;
}

// ───────── Rail de paiement : PI-SPI (BCEAO) ─────────
// Plateforme Interopérable du Système de Paiement Instantané : banques, EME
// (Mobile Money / wallets) et microfinance des 8 pays, 24h/24, paiement en
// quelques secondes et irrévocable. Une fintech n'y accède pas en direct : elle
// passe par un participant (banque ou EME) qui expose l'« API Business ».

export type InstitutionType = "eme" | "bank" | "sfd";

export const INSTITUTION_TYPES: { id: InstitutionType; label: string; hint: string }[] = [
  { id: "eme", label: "Mobile Money / wallet", hint: "Ex. votre portefeuille électronique" },
  { id: "bank", label: "Banque", hint: "Ex. votre compte courant" },
  { id: "sfd", label: "Microfinance", hint: "Ex. votre caisse ou mutuelle" },
];

export const PISPI = {
  /** Frais facturés par le participant partenaire sur l'encaissement — HYPOTHÈSE à négocier */
  partnerFee: 0.003,
  /** Plafond PI-SPI par paiement vers un particulier (hors limites propres à chaque établissement) */
  maxPerPayment: 5_000_000,
  /** Délai laissé au payeur pour valider une demande de paiement */
  requestTimeoutSec: 300,
};

export type KycLevel = 0 | 1 | 2 | 3;

/** Niveaux KYC et plafonds (CDC 2.3.1) */
export const KYC_LEVELS: {
  level: KycLevel;
  title: string;
  documents: string[];
  daily: number | null;
  monthly: number | null;
}[] = [
  { level: 0, title: "Niveau 0", documents: ["Téléphone vérifié"], daily: 10_000, monthly: 30_000 },
  { level: 1, title: "Niveau 1", documents: ["CNI ou passeport", "Selfie"], daily: 100_000, monthly: 500_000 },
  {
    level: 2,
    title: "Niveau 2",
    documents: ["Niveau 1", "Justificatif de domicile", "Justificatif de revenus"],
    daily: 1_000_000,
    monthly: 5_000_000,
  },
  {
    level: 3,
    title: "Niveau 3",
    documents: ["Niveau 2", "Dossier professionnel complet"],
    daily: null,
    monthly: null,
  },
];

/** Rafraîchissement des prix : 30 s (CDC 9.1), 2 min en mode économie de données */
export const PRICE_REFRESH_MS = 30_000;
export const PRICE_REFRESH_SAVER_MS = 120_000;

/** Contacts support — À DÉFINIR avant lancement */
export const SUPPORT = {
  email: "support@cryptopay-niger.example",
  phone: "+227 00 00 00 00 (à définir)",
  hours: "8h – 20h WAT",
  /** Numéro WhatsApp support — À DÉFINIR (vide = masqué) */
  whatsapp: "",
};

/** Mode démonstration : OTP, paiements PI-SPI et KYC sont simulés côté client. */
export const DEMO_MODE = true;
export const DEMO_OTP = "123456";

// ───────── Confiance & sécurité (réponses aux faiblesses des concurrents) ─────────

/** Devis garanti : le prix affiché est le prix exécuté pendant cette durée */
export const QUOTE_TTL_SEC = 30;
/** Délai de sécurité avant qu'une nouvelle adresse de liste blanche soit utilisable */
export const WHITELIST_DELAY_MS = 24 * 3_600_000;
/** Au-delà de ce montant, une vérification anti-arnaque est demandée avant l'envoi */
export const LARGE_SEND_FCFA = 100_000;
/** Délais annoncés (affichés dans le suivi des transactions) */
export const SLA = {
  buy: "moins d'1 minute après validation PI-SPI",
  sell: "quelques secondes (PI-SPI, 24h/24)",
  sendInternal: "instantané",
  sendExternal: "5 à 30 min selon le réseau (Lightning : instantané)",
};

// ───────── Services ─────────

/** Recharge de crédit téléphonique payée en crypto — frais HYPOTHÈSE */
export const AIRTIME = { fee: 0.01, presets: [500, 1_000, 2_000, 5_000, 10_000], min: 100, max: 50_000 };

/** Parrainage — récompense HYPOTHÈSE, à valider (budget marketing) */
export const REFERRAL = { rewardFCFA: 1_000, minFirstBuyFCFA: 10_000 };
