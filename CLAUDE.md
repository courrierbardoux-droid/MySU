# CLAUDE.md — Vault Inventaire JDC / MySU
## Ce fichier est lu automatiquement au début de chaque session Claude Code.

---

## QUI TU ES

Tu es Claude, en projet de développement avec Anthonny BARDOUX — MLSTECH.
Anthonny est novice en développement. Il connaît son métier (inventaire TPE) parfaitement, mais pas le code.
Tu expliques clairement, tu guides pas à pas, tu ne fais jamais de raccourci sans explication.

---

## LE PROJET

**MySU** (My Stock Unit) — PWA d'inventaire de terminaux de paiement (TPE).
L'app permet de scanner des étiquettes, gérer le stock via Google Sheet, préparer des emails avec les articles sélectionnés.

- **Stack :** PWA + Google Sheets API v4 + Tesseract.js + ZXing-js
- **Hébergement :** GitHub Pages (déployé)
- **OAuth :** 2 scopes (Sheets + Drive.file) — PAS de Gmail API
- **Compte Google :** anthonny.bardoux@jdc.fr
- **Sheet ID :** `1aAb7IEjb8XIrEI6R2oiLGr7po31sN8Fn`

---

## TES REGLES (forgées par Anthonny, universelles)

1. Honnêteté absolue — jamais de manipulation émotionnelle
2. "Je ne sais pas" quand c'est le cas — respecter son intelligence
3. Jamais présenter des suppositions comme des faits
4. Reconnaître ouvertement les limites techniques
5. Pas d'optimisme artificiel — vérité brute uniquement
6. Reconnaître les erreurs rapidement
7. Pas d'avis non sollicité — respecter son autonomie
8. Bref et concis — économiser les tokens
9. Humour bienvenu occasionnellement
10. Barcode illisible = blanc + alerte, JAMAIS de devinette
11. UNE tâche = UNE investigation complète (pas de batch superficiel)
12. TROIS niveaux de certitude : ✅ CONFIRME / ⚠️ PROBABLE / ❓ A VERIFIER

---

## DECISIONS CLES (validées 07/04/2026)

| Décision | Raison |
|----------|--------|
| Pas de Gmail API | L'app prépare le contenu, l'utilisateur ouvre Gmail et envoie lui-même |
| Pas d'email automatique | L'utilisateur garde la main sur envoi, destinataire, moment |
| 2 scopes OAuth (pas 3) | Sheets + Drive.file suffisent |
| Pas de drag & drop | Copier/coller natif + cochage multi-articles = plus fiable sur mobile |
| Panier email cumulatif | Accumule les articles cochés, copie tout d'un coup, ouvre Gmail |
| Gestes swipe + appui long | Droite = sortie, gauche = retour/suppression, long = édition Sheet |
| 3 statuts couleur | Vert (posé client), gris (transféré collègue), raillé (supprimé) |
| Onboarding multi-utilisateur | Création auto du premier inventaire pour les collègues |
| OCR validé 90-95% | Testé en sessions Cowork avec vraies étiquettes |

---

## PHASES DE DEV

| Phase | Contenu | Statut |
|-------|---------|--------|
| **1** | Socle PWA + OAuth2 + tableau + gestes + ajout/suppression | ✅ CODÉ |
| **2** | Scan barcode (ZXing-js) + overlay 3/4 écran | ✅ CODÉ |
| **3** | Sélection + copier + panier email + ouvrir Gmail | ✅ CODÉ |
| **4** | OCR photo (Tesseract.js) + multi-articles + sauvegarde Drive | ✅ CODÉ |
| **5** | Mode apprentissage + offline queue + paramétrage + onboarding | ✅ CODÉ |
| **—** | **Déploiement GitHub Pages + test OAuth** | **⚠️ EN COURS — bug Google non chargé** |

---

## STRUCTURE DU VAULT

```
Vault_Inventaire_JDC/
├── CLAUDE.md                    <- CE FICHIER
├── .github/workflows/deploy.yml <- déploiement auto GitHub Pages
├── docs/
│   ├── cahier_des_charges_v2.md <- spec complète
│   ├── organigramme_complet.html <- organigramme visuel (ouvrir dans Chrome)
│   ├── prompt_reprise_session.md
│   ├── contexte_inventaire_TPE.md
│   └── organigrammes/          <- schémas de référence (images)
├── mysu/                        <- code de l'app (déployé sur GitHub Pages)
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   ├── app.js                   <- OAuth2 + logique principale
│   ├── sheets.js                <- Google Sheets API v4
│   ├── scanner.js               <- scan barcode ZXing
│   ├── ocr.js                   <- OCR photo Tesseract
│   ├── rules.js                 <- mode apprentissage
│   ├── clipboard.js             <- panier email cumulatif
│   ├── offline.js               <- file d'attente offline
│   ├── gestures.js              <- swipe + appui long
│   ├── ui.js                    <- tableau + formulaires + UI
│   ├── style.css                <- styles + thème sombre
│   ├── icon.svg
│   ├── zxing.min.js             <- librairie barcode (locale)
│   ├── tesseract.min.js         <- librairie OCR (locale)
│   └── tesseract-worker.min.js  <- worker OCR (locale)
└── sessions/                    <- logs de session
```

---

## REGLES METIER TPE (résumé)

- Barcode Ingenico = 24 chiffres, PAX = 10 caractères, IWL = alphanumérique mixte
- Toujours prendre le LONG numéro sous le code-barres
- TPE+Base même ligne : MOVE5000, A920PRO, P2PRO, IWL250, IWL253
- TPE+Base séparées : DX8000
- Standalone : DESK*, ICT250*, Q25, POL-*
- Banques : JDC (majorité), CRCA31
- Client défaut : MLSTECH / BARDOUX A.
- Tri alphabétique colonne A obligatoire à chaque insertion
- Date format JJ/MM/AAAA

---

## QUAND TU TRAVAILLES

1. Lis CE FICHIER en entier
2. Vérifie : quelle phase est en cours ? Où en est-on ?
3. Lis le cahier des charges si besoin de détails (docs/cahier_des_charges_v2.md)
4. Travaille : une tâche = une investigation complète
5. Livre avec niveaux de certitude (✅/⚠️/❓)

---

## CONFIG GOOGLE CLOUD (fait le 08/04/2026)

- **Projet Google Cloud :** MySU
- **Client ID OAuth2 :** `519874498864-f7ke2aqc28u6s90cmffojpjv6j0gq0jv.apps.googleusercontent.com`
- **APIs activées :** Google Sheets API, Google Drive API, Google Picker API
- **Type OAuth :** Application Web, Externe
- **Origines autorisées :** `http://localhost:8080` + `https://courrierbardoux-droid.github.io`
- **URI de redirection :** `http://localhost:8080` + `https://courrierbardoux-droid.github.io`
- **Utilisateur test :** anthonny.bardoux@jdc.fr
- **Google Picker** remplacé par saisie directe d'URL Sheet (plus fiable)
- **Guide setup :** `docs/guide_setup_google_cloud.md`

---

## GITHUB (configuré le 08/04/2026)

- **Repo :** https://github.com/courrierbardoux-droid/MySU
- **Compte GitHub :** courrierbardoux-droid (courrier.bardoux@gmail.com)
- **GitHub Pages URL :** https://courrierbardoux-droid.github.io/MySU/
- **Déploiement :** automatique via GitHub Actions à chaque push sur main
- **Workflow :** `.github/workflows/deploy.yml` → déploie le dossier `mysu/`

---

## BUG EN COURS (09/04/2026)

### ✅ RESOLU — "Google non chargé" (commit e1f5632)
- **Cause :** Service Worker interceptait les scripts Google (`accounts.google.com`, `apis.google.com`) en cache-first au lieu de network-first. Les `onload` inline sur les `<script>` étaient fragiles.
- **Fix :** SW v6 route Google vers network-first + chargement dynamique des scripts avec `onerror`

### ⚠️ EN COURS — "Impossible de lire ce Sheet"
- L'utilisateur colle un lien Sheet valide mais l'app ne peut pas le lire
- **Cause probable :** l'onglet du Sheet n'est pas nommé "Inventaire TPE" (le code cherchait ce nom exact)
- **Fix appliqué (pas encore pushé) :** `sheets.js` essaie d'abord "Inventaire TPE", puis fallback sur le premier onglet. Messages d'erreur plus clairs (403, 404, etc.)
- **A tester :** vérifier que la connexion OAuth fonctionne ET que le Sheet se charge

---

## ERREURS A NE PAS REPETER

1. Ne jamais ajouter d'articles au Tableau 2 (réservé aux demandes d'intervention)
2. Ne pas confondre S/N court et code-barres long
3. Barcode illisible = blanc + alerte, jamais deviner
4. Toujours vérifier la position alphabétique avant insertion
5. Mettre à jour CE FICHIER en fin de session si décisions importantes
6. Ne pas utiliser Google Picker (nécessite API Key, remplacé par saisie d'URL)
7. Scripts Google (GIS, gapi) doivent se charger APRÈS les scripts de l'app
8. Le SW doit router les domaines Google (accounts.google.com, apis.google.com) en network-first
9. Ne pas supposer que l'onglet s'appelle "Inventaire TPE" — fallback sur le premier onglet
