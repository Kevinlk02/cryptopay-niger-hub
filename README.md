# CryptoPay Niger — prototype web

Application mobile (prototype React + Tailwind) pour acheter, stocker et envoyer des cryptos depuis une banque, un wallet Mobile Money ou une microfinance des **8 pays de l'UEMOA**, via **PI-SPI** (plateforme de paiement instantané de la BCEAO).
Spécifications : *Cahier des charges v2.0* (`CryptoPay_Niger_CDC_v2.docx`), révisé en v0.3 : le rail PI-SPI remplace les intégrations directes Moov / Orange / My Nita.

## Lancer

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # build de production dans dist/
```

## Ce qui est réel / simulé

| Fonction | État |
|---|---|
| Prix, variations 24h, chandeliers | **Réels** — API publique Binance (rafraîchis toutes les 30 s, 2 min en mode économie de données), cache hors-ligne |
| Onboarding (8 pays UEMOA), OTP, PIN, biométrie | Simulés côté client (OTP démo : `123456`) |
| Paiements PI-SPI (demande de paiement, QR, retrait instantané, résolution d'alias) | Simulés (aucun débit) — calqués sur l'API Business : statuts `INITIE → ENVOYE → IRREVOCABLE` |
| Envois blockchain, adresses de réception | Simulés (adresses de démo déterministes) |
| KYC | Envoi de documents simulé, approbation via bouton démo |
| Données utilisateur | `localStorage` du navigateur |

Pour passer en production il faut le backend décrit au CDC §6 (Auth, Payment, Wallet, Transfer, Compliance…). Le Payment Service appellera l'API Business PI-SPI **d'un participant partenaire** (banque ou EME agréé BCEAO) : OAuth2 + mTLS, webhooks signés HMAC. Une fintech ne peut pas se connecter directement à PI-SPI. Les clés API Binance, PI-SPI et le custody (Fireblocks/BitGo) ne doivent jamais être appelés depuis le navigateur. Paramètres PI-SPI : `src/lib/config.ts` (`PISPI`, `COUNTRIES`).

## Fonctionnalités issues de l'analyse concurrentielle (v0.4)

Repris des points forts des concurrents (Yellow Card, Bitnob, CryptoXOF, Binance P2P…) ou en réponse à leurs faiblesses :

- **Devis garanti 30 s** (Acheter, Retirer, Échanger) : le prix affiché est le prix exécuté
- **Livraison directe** d'un achat vers Binance / OKX / un autre wallet
- **Envoi gratuit par numéro de téléphone** UEMOA (en plus des @utilisateurs)
- **Bitcoin Lightning** (envoi/réception instantanés, frais quasi nuls)
- **Anti-arnaque** : détection d'adresse piégée, alerte première adresse, confirmation renforcée au-delà de 100 000 FCFA
- **Liste blanche d'adresses** (délai de 24 h) et **gel d'urgence des retraits** (Profil → Sécurité)
- **Suivi étape par étape** de chaque transaction, délai annoncé, bouton « Signaler un problème »
- **Recharge mobile** payée en crypto (8 pays)
- **Achats programmés** (individuels, validés à chaque échéance via PI-SPI)
- **Parrainage**, **Académie** (6 leçons + quiz, dont les arnaques), **Transparence** (engagements + preuve de réserves de démo), **État des services**

Hors périmètre volontaire : tontine / épargne collective (application dédiée prévue plus tard).

## Structure

- `src/lib/` — paramètres métier (`config.ts` : frais, plafonds KYC, opérateurs), catalogue crypto/réseaux et validation d'adresses (`assets.ts`), API Binance, formats, i18n, textes légaux
- `src/store/` — état global persistant (`AppStore.tsx`) et navigation (`nav.tsx`)
- `src/components/onboarding/` — inscription et écran de verrouillage
- `src/components/screens/` — Accueil, Acheter, Envoyer, Recevoir, Marché, Wallet, Retirer, Échanger, Historique, Profil (+ sous-sections), services (`screens/services/`)
- `src/components/kit/` — composants du design system (boutons pilule, toggles, sheets, pavés, graphiques, scanner QR)

⚠ Les textes légaux, les traductions haoussa/zarma (partielles) et les frais opérateurs sont des projets à valider avant lancement.
