// Documents légaux (CDC 4.8 — CGU & Légal).
// ⚠ PROJETS DE TEXTE : à faire valider par l'avocat mandaté avant toute mise en production.

import { COUNTRIES, FEES, KYC_LEVELS, PISPI } from "./config";
import { formatNumber } from "./format";

export interface LegalDoc {
  id: "cgu" | "privacy" | "aml" | "fees" | "licenses";
  title: string;
  sections: { heading: string; body: string }[];
}

const pct = (v: number) => `${formatNumber(v * 100, 2)} %`;

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "cgu",
    title: "Conditions Générales d'Utilisation",
    sections: [
      { heading: "1. Objet", body: `CryptoPay Niger permet d'acheter, stocker, envoyer et recevoir des crypto-actifs. Les paiements en FCFA transitent par PI-SPI, la plateforme de paiement instantané de la BCEAO, depuis ou vers un compte bancaire, un wallet Mobile Money ou un compte de microfinance ouvert dans l'un des 8 pays de l'UEMOA (${COUNTRIES.map((c) => c.name).join(", ")}).` },
      { heading: "2. Accès au service", body: "Le service est réservé aux personnes majeures résidant dans un pays de l'UEMOA et disposant d'un numéro de téléphone vérifié. Les comptes de paiement utilisés doivent être au nom de l'utilisateur. L'accès à certains montants est conditionné au niveau de vérification d'identité (KYC)." },
      { heading: "3. Risques", body: "Les crypto-actifs sont des actifs volatils. Leur valeur peut baisser fortement et rapidement, jusqu'à la perte totale du capital investi. Les stablecoins (USDT, USDC) réduisent ce risque sans l'éliminer. N'investissez que des sommes que vous pouvez vous permettre de perdre." },
      { heading: "4. Responsabilité de l'utilisateur", body: "L'utilisateur est seul responsable de l'exactitude des adresses de destination et du réseau choisi. Une transaction envoyée sur la blockchain est irréversible, de même qu'un paiement PI-SPI confirmé." },
      { heading: "5. Sécurité du compte", body: "L'utilisateur protège son code PIN et ses appareils. CryptoPay Niger ne demandera jamais votre PIN par téléphone, SMS ou message." },
      { heading: "6. Suspension", body: "CryptoPay Niger peut suspendre un compte en cas de suspicion de fraude, de blanchiment ou de non-respect des présentes conditions, conformément à la Loi Uniforme UEMOA relative à la lutte contre le blanchiment." },
    ],
  },
  {
    id: "privacy",
    title: "Politique de Confidentialité",
    sections: [
      { heading: "Cadre légal", body: "Les données personnelles sont traitées conformément à la loi de protection des données du pays de résidence de l'utilisateur (par exemple : Loi N°2017-28 au Niger, Loi N°2008-12 au Sénégal, Loi N°2013-450 en Côte d'Ivoire). Le traitement est déclaré auprès de l'autorité de protection des données de chaque pays où le service est ouvert." },
      { heading: "Données collectées", body: "Pays et numéro de téléphone, nom, documents d'identité et selfie (KYC), alias PI-SPI et établissements de paiement liés, historique des transactions, informations techniques de l'appareil (journal des connexions)." },
      { heading: "Finalités", body: "Fourniture du service, vérification d'identité, contrôle de concordance entre le titulaire de l'alias PI-SPI et l'identité vérifiée, prévention de la fraude et du blanchiment (obligations CENTIF), support client." },
      { heading: "Conservation", body: "Les journaux d'audit des opérations critiques sont conservés 5 ans. Les autres données sont supprimées à la clôture du compte, sous réserve des obligations légales." },
      { heading: "Vos droits", body: "Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. La suppression peut être demandée à tout moment depuis Profil → Sécurité → Supprimer mon compte. Un Délégué à la Protection des Données (DPO) sera désigné." },
      { heading: "Consentement", body: "Votre consentement est recueilli explicitement à l'inscription et horodaté." },
    ],
  },
  {
    id: "aml",
    title: "Politique AML / KYC",
    sections: [
      { heading: "Engagement", body: "CryptoPay Niger applique un programme de lutte contre le blanchiment et le financement du terrorisme conforme à la Recommandation 15 du GAFI (prestataires de services sur actifs virtuels) et à la Loi Uniforme UEMOA, appliqué dans chacun des pays où le service est ouvert." },
      { heading: "Vérification progressive", body: KYC_LEVELS.map((l) => `${l.title} : ${l.documents.join(", ")} — ${l.daily === null ? "plafond sur approbation individuelle" : `${formatNumber(l.daily)} FCFA/jour, ${formatNumber(l.monthly!)} FCFA/mois`}`).join("\n") },
      { heading: "Surveillance", body: "Les transactions sont surveillées (listes OFAC et ONU, comportements atypiques). Seuls des comptes PI-SPI au nom de l'utilisateur sont acceptés (pas de paiement pour un tiers). Les opérations suspectes font l'objet d'une déclaration à la CENTIF du pays concerné dans les 48 heures, et sont partagées avec l'établissement participant partenaire." },
      { heading: "Responsable conformité", body: "Un responsable conformité est désigné et transmet un rapport trimestriel des volumes à la CENTIF." },
    ],
  },
  {
    id: "fees",
    title: "Grille Tarifaire",
    sections: [
      { heading: "Achat via PI-SPI", body: `Commission CryptoPay : ${pct(FEES.buyCommission)} du montant.\nFrais du prestataire PI-SPI partenaire : ${pct(PISPI.partnerFee)} (provisoire).\nVotre banque ou votre wallet peut appliquer ses propres frais.` },
      { heading: "Taux de change", body: `Le taux appliqué inclut un écart (spread) de ${pct(FEES.spread)} par rapport au cours Binance en temps réel.` },
      { heading: "Retrait vers un compte PI-SPI", body: `Commission : ${pct(FEES.sellCommission)} du montant. Paiement instantané, 24h/24, plafonné à ${formatNumber(PISPI.maxPerPayment)} FCFA par opération.` },
      { heading: "Envoi externe (Binance, OKX, autre wallet)", body: `${pct(FEES.externalWithdraw)} + frais réseau blockchain (variables selon le réseau).` },
      { heading: "Envoi interne (@utilisateur)", body: "Gratuit entre utilisateurs CryptoPay." },
      { heading: "Taxes", body: `Les frais de service sont soumis à la TVA du pays de résidence (ex. ${pct(FEES.vat)} au Niger), incluse dans les montants affichés.` },
    ],
  },
  {
    id: "licenses",
    title: "Agréments & Statut Réglementaire",
    sections: [
      { heading: "Statut actuel", body: "Prototype — le service n'est pas encore ouvert au public. Aucune transaction réelle n'est exécutée dans cette version." },
      { heading: "Démarches en cours", body: "• Accès à PI-SPI via un participant direct (banque ou EME agréé BCEAO) qui expose l'API Business — CryptoPay Niger n'est pas participant direct\n• Déclaration d'activité VASP auprès de la CENTIF de chaque pays d'ouverture\n• Déclarations auprès de l'autorité de protection des données de chaque pays\n• À terme : agrément d'établissement de paiement auprès de la BCEAO (Instruction N°008-05-2015), qui permettrait une participation directe à PI-SPI\n• Suivi des travaux du comité C-CRYPTO de la BCEAO : aucun cadre spécifique aux crypto-actifs n'est encore en vigueur dans l'UEMOA" },
      { heading: "Société", body: "Immatriculation au RCCM de Niamey en cours (SAS/SARL). Les mentions légales complètes seront publiées à l'ouverture du service." },
    ],
  },
];
