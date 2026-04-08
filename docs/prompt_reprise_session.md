# PROMPT DE REPRISE — MySU / Session PWA Inventaire TPE
*Copie-colle ce bloc en début de session, puis uploade les fichiers listés.*

---

```
Tu reprends le projet MySU (My Stock Unit) pour Anthonny BARDOUX — MLSTECH.
Anthonny est novice en développement. Explique clairement, guide pas à pas.

---

PROJET : MySU — PWA Inventaire TPE
Stack : PWA + Google Sheets API v4 + Tesseract.js + ZXing-js (PAS de Gmail API)
Hébergement : GitHub Pages
OAuth : 2 scopes uniquement (Sheets + Drive.file)
Compte Google : anthonny.bardoux@jdc.fr
Sheet ID : 1aAb7IEjb8XIrEI6R2oiLGr7po31sN8Fn

---

DECISIONS CLES (validées 07/04/2026) :
- Pas de Gmail API → l'app prépare le contenu, l'utilisateur ouvre Gmail et envoie lui-même
- Pas d'email automatique → l'utilisateur garde la main
- Panier email cumulatif → accumule les articles cochés, copie tout d'un coup dans le presse-papier, puis ouvre Gmail
- Pas de drag & drop → copier/coller natif + cochage multi-articles (plus fiable sur mobile)
- Gestes swipe (droite = sortie client/collègue, gauche = retour agence/supprimer) + appui long = ouvrir Google Sheet
- 3 statuts couleur : vert (posé chez client), gris (transféré collègue), raillé (supprimé)
- Onboarding multi-utilisateur : création auto du premier inventaire pour les collègues
- OCR Tesseract.js validé à 90-95% sur vraies étiquettes (testé en Cowork)
- Illisible = blanc + alerte, jamais de devinette

---

PHASES DE DEV :

Phase 1 — Socle (priorité absolue)
  - PWA installable + manifest.json + service-worker.js + icône
  - OAuth2 Google (Sheets + Drive.file)
  - Onboarding : inventaire existant ? sinon création auto "inventaire_mois_année"
  - Affichage tableau Google Sheet (Stock + Demandes, même page)
  - Gestes swipe droite/gauche + appui long
  - Codes couleur (vert/gris/raillé)
  - Formulaire ajout manuel + tri alphabétique auto
  - Suppression simple et multi-sélection

Phase 2 — Scan barcode
  - ZXing-js, caméra temps réel, overlay 3/4 écran
  - Reconnu → Poser / Transférer / Supprimer
  - Non reconnu → proposer ajout

Phase 3 — Sélection + Copier + Email
  - Cochage multi-articles + bandeau action
  - Panier email cumulatif + badge compteur
  - Bouton Email → copie bloc formaté + ouvre Gmail natif
  - Copier/coller natif universel

Phase 4 — OCR photo
  - Tesseract.js (caméra ou galerie)
  - Score confiance, illisible = blanc + alerte
  - Multi-articles séquentiel
  - Sauvegarde photo Drive

Phase 5 — Avancé
  - Mode apprentissage (étiquette inconnue → mémorisation)
  - Offline queue + synchro
  - Paramétrage colonnes, thème clair/sombre
  - Guide onboarding collègues

---

FICHIERS DU PROJET :
mysu/
├── index.html, manifest.json, service-worker.js
├── app.js (logique + routing + onboarding)
├── sheets.js (Google Sheets API v4)
├── scanner.js (ZXing-js)
├── ocr.js (Tesseract.js)
├── rules.js (schémas mémorisés)
├── clipboard.js (panier email + copier/coller)
├── offline.js (file d'attente + synchro)
├── gestures.js (swipe + appui long)
├── ui.js (tableau, formulaires, couleurs)
├── style.css
└── icon.svg

---

REGLES METIER TPE :
- Barcode Ingenico = 24 chiffres, PAX = 10 caractères, IWL = alphanumérique mixte
- Toujours prendre le LONG numéro sous le code-barres
- TPE+Base même ligne : MOVE5000, A920PRO, P2PRO, IWL250, IWL253
- TPE+Base lignes séparées : DX8000
- Standalone : DESK*, ICT250*, Q25, POL-*
- Banques : JDC (majorité), CRCA31
- Client défaut : MLSTECH / BARDOUX A.
- Tri alphabétique colonne A obligatoire à chaque insertion

---

QUESTIONS A POSER EN DEBUT DE SESSION :
- Où en est-on ? Quelle phase ?
- GitHub configuré ? Nom du repo ?
- Couleurs MLSTECH officielles définies ?
- Des photos d'étiquettes à traiter en priorité ?

Lis le cahier des charges complet (cahier_des_charges_pwa_inventaire.md) pour les détails.
Attends les instructions d'Anthonny avant de commencer quoi que ce soit.
```

---

## FICHIERS A UPLOADER EN DEBUT DE SESSION

1. `cahier_des_charges_pwa_inventaire.md` — spec complète v2
2. `contexte_inventaire_TPE.md` — règles métier détaillées + contenu actuel du Sheet
3. `icon.svg` — icône de l'app
4. Ce fichier (`prompt_reprise_session.md`) — à copier-coller comme premier message
