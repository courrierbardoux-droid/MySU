# Cahier des charges — MySU (My Stock Unit) v2
## PWA Inventaire TPE — MLSTECH
**Client :** Anthonny BARDOUX — MLSTECH
**Date :** Avril 2026
**Révision :** v2 — 07/04/2026 (intègre les décisions organigrammes + discussion)
**Stack :** PWA + Google Sheets API v4 + Tesseract.js + ZXing-js
**Hébergement :** GitHub Pages

---

## 1. CONTEXTE

Anthonny reçoit et expédie des cartons de TPE (terminaux de paiement). Il gère le stock en temps réel : enregistrer les entrées (scan barcode / photo étiquette), gérer les sorties (poser chez client, transférer à un collègue, renvoyer en agence), consulter le stock, et préparer des emails avec les articles sélectionnés.

**MySU** est une PWA installable sur téléphone Android (via "Ajouter à l'écran d'accueil") et PC. Elle est connectée au Google Sheet existant via API.

L'app est conçue pour être utilisée par Anthonny ET par ses collègues (chacun crée son propre inventaire au premier lancement).

---

## 2. NOM ET IDENTITE VISUELLE

- **Nom :** MySU
- **Icone :** style "carton de stock" (fichier `icon.svg`)
- **Couleurs :** bleu #2F5496 + blanc (provisoire, cohérent avec le Sheet)
- **Theme :** clair par défaut, sombre disponible dans les paramètres

---

## 3. GOOGLE SHEET

- **Nom par défaut :** "Inventaire Avril 2026.xlsx" — modifiable dans les paramètres
- **ID :** `1aAb7IEjb8XIrEI6R2oiLGr7po31sN8Fn`
- **Compte :** anthonny.bardoux@jdc.fr
- **Onglet :** "Inventaire TPE"

### Structure (inchangée)
**Tableau 1 — Stock** (commence ligne 1)
| A : Produit | B : TPE | C : Base | D : Banque | E : Date | F : Client |

1 ligne vide de séparation

**Tableau 2 — Demandes d'intervention**
| A : Demande | B : Compte | C : Raison Sociale |

---

## 4. AUTH OAUTH2

### Scopes (2 uniquement)
```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.file
```

**Gmail API supprimée** — l'app ouvre Gmail nativement, pas d'envoi programmatique.

### Configuration
- Projet Google Cloud Console (gratuit)
- Ecran de consentement : usage interne (pas de vérification Google nécessaire)
- A configurer avec Anthonny en début de première session dev

---

## 5. DEMARRAGE DE L'APP (onboarding)

```
Démarre l'app
    |
    v
Inventaire existant ?
    |               |
   OUI             NON
    |               |
    v               v
Afficher le       Guide de création :
tableau           1. Connexion Google (OAuth)
                  2. Création auto du fichier Sheet
                     nommé "inventaire_mois_année"
                  3. Vérification présence sur Drive
                  4. -> Afficher le tableau
```

L'app s'ouvre **directement sur le tableau d'inventaire**. Pas d'écran d'accueil.
Le guide de création sert aussi d'onboarding pour les collègues qui utilisent l'app pour la première fois.

---

## 6. ECRAN PRINCIPAL — Vue Tableau

### Affichage
- Tableau scrollable, lecture seule dans la PWA
- **Tableau 1 (Stock)** en haut, **Tableau 2 (Demandes)** en dessous, séparés visuellement
- Colonnes : Produit / TPE / Base / Banque / Date / Client
- Checkbox de sélection en début de chaque ligne

### Gestes sur les lignes

| Geste | Action | Effet visuel |
|-------|--------|-------------|
| **Swipe droite** | Sortie : poser chez client ou transférer collègue | Choix Poser/Transférer |
| **Swipe gauche** | Retour : renvoyer en agence ou supprimer | Choix Agence/Supprimer |
| **Appui long** | Ouvre Google Sheet dans le navigateur pour édition libre | Lien direct |

### Codes couleur des statuts

| Statut | Couleur | Icone |
|--------|---------|-------|
| **Posé** (chez client) | Fond **vert** | ✕ pour supprimer la ligne |
| **Transféré** (collègue) | Fond **gris** | ✕ pour supprimer la ligne |
| **Supprimé** | Police **raillée** (barré) | ✕ pour confirmer suppression |

### Cochage multi-articles
- Checkbox en début de ligne pour sélectionner un ou plusieurs articles
- Bandeau fixe apparaît : **"N article(s) sélectionné(s) — [Copier] [Email] [Annuler]"**
- **[Copier]** → copie le bloc formaté dans le presse-papier système
- **[Email]** → ajoute les articles au panier email (buffer cumulatif)
- **[Annuler]** → désélectionne tout

---

## 7. BARRE D'ACTIONS (fixe en bas d'écran)

```
[ Menu ]   [ Scan/OCR ]   [ + ]   [ Email ]
```

---

## 8. BOUTON [MENU] — bas gauche

Panneau latéral avec :

### Paramètres généraux
- Nom du fichier Google Sheet (modifiable)
- ID du fichier Google Sheet (modifiable)
- Compte Google connecté + bouton "Changer de compte"
- Thème clair / sombre
- Ordre des colonnes (réordonnables)

---

## 9. BOUTON [SCAN / OCR] — bas centre-gauche

### Mode A — Scan barcode 1D (ZXing-js)
```
Ouvrir caméra (overlay 3/4 écran, tableau visible derrière)
    |
    v
ZXing détecte le barcode en temps réel
    |
    v
Numéro extrait
    -> Trouvé dans le stock -> afficher la ligne -> proposer action (Poser/Transférer/Supprimer)
    -> Non trouvé -> proposer Entrée (formulaire pré-rempli)
```

### Mode B — Photo étiquette (Tesseract.js)
```
Ouvrir caméra / sélectionner photo depuis galerie
    |
    v
Image nette ?
    |           |
   OUI         NON -> % lisibilité affiché
    |                  Photo sauvegardée sur Drive
    |                  pour classement en 2ème étape
    v
Tesseract.js analyse l'image (local, offline)
    |
    v
Extraire : produit, barcode(s), banque, date, client
Illisible = blanc + alerte (jamais de devinette)
    |
    v
Type d'étiquette reconnu ?
    OUI -> fiche pré-remplie (tous champs modifiables)
    NON -> MODE APPRENTISSAGE (section 12)
    |
    v
[VALIDER] -> insertion alphabétique auto via API
```

### Multi-articles (photo avec plusieurs étiquettes)
- OCR détecte N articles -> traitement séquentiel
- Fiche de confirmation article par article

### Overlay caméra
- Scanner occupe 3/4 de l'écran
- Le tableau reste visible en dessous (1/4)
- Permet copier/coller ou glisser depuis la capture

---

## 10. BOUTON [+] — bas centre

Formulaire d'ajout manuel :

- **Produit :** liste déroulante (types connus) + "Nouveau type..."
- **Barcode TPE :** saisie texte
- **Barcode Base :** saisie texte (affiché seulement si le produit a une base)
- **Banque :** [JDC] [CRCA31] [Autre]
- **Date :** datepicker (défaut : aujourd'hui)
- **Client :** [MLSTECH / BARDOUX A.] [RECEP. (RET. GARANTIE)] [RECEPTION] [Autre]
- **[Ajouter au stock]** -> insertion alphabétique auto via API

---

## 11. BOUTON [EMAIL] — bas droite

### Panier email cumulatif
L'app accumule les articles au fil de la session de travail :
- Chaque fois qu'on coche des articles et qu'on appuie sur [Email] dans le bandeau, ils sont ajoutés au **panier email**
- Badge compteur visible sur le bouton Email : **"Email (5)"**
- L'app peut demander "Autre chose à ajouter ?" pendant les scans

### Envoi
- Tap sur le bouton [Email] -> l'app copie tout le bloc formaté dans le presse-papier -> ouvre Gmail nativement
- L'utilisateur colle le contenu dans le corps du mail
- L'utilisateur choisit lui-même : destinataire, objet, moment d'envoi (immédiat ou différé)
- **L'app n'envoie jamais d'email elle-même** — elle prépare, l'utilisateur envoie

### Format du bloc copié
```
Article 1 : MOVE5000 | TPE: 232257... | Base: 202007... | JDC
Article 2 : A920PRO | TPE: 1850328645 | Base: 2230572347 | JDC
Article 3 : DESK1600 | TPE: 232347... | CRCA31
(format exact à affiner avec Anthonny)
```

---

## 12. MODE APPRENTISSAGE (étiquette inconnue)

```
Q1 : "Quel est le nom de ce produit ?"
     Liste connue + "Nouveau type"

Q2 : "Tableau Stock ou Tableau Demandes ?"

Q3 : "Ce produit a-t-il une Base ?"
     [Oui, même ligne] [Oui, ligne séparée] [Non]

Q4 : "Quelle banque ?"
     [JDC] [CRCA31] [Autre]

Q5 : "Quel client ?"
     [MLSTECH / BARDOUX A.] [RECEP. (RET. GARANTIE)] [RECEPTION] [Autre]

-> Mémoriser ce schéma -> appliquer automatiquement aux prochaines occurrences
```

Stockage : localStorage (offline) + synchronisation JSON sur Google Drive (online).

---

## 13. ACTIONS SUR LES ARTICLES

### Après scan/OCR : article reconnu
3 choix possibles :

| Action | Description | Effet tableau | Suite |
|--------|------------|--------------|-------|
| **Poser** | Poser chez un client | Ligne fond vert + ✕ | Copier/coller vers destination |
| **Transférer** | Donner à un collègue | Ligne fond gris + ✕ | Ouvre Gmail avec articles pré-copiés |
| **Supprimer** | Retirer du stock | Ligne police raillée + ✕ | Suppression dans le Sheet via API |

### Après scan/OCR : article non reconnu
- Proposer : Copier/coller ? Créer insertion tableau ? Poser chez client ?
- Si création -> formulaire pré-rempli avec ce que l'OCR a pu lire

### Action manuelle (depuis le tableau)

| Geste | Action | Sous-choix |
|-------|--------|-----------|
| **Swipe droite** | Sortie | Poser (client) ou Collègue (email) |
| **Swipe gauche** | Retour | Agence (renvoi) ou Supprimer |
| **Appui long** | Edition | Ouvre Google Sheet directement |

**Poser chez client :** copier/coller avec système de cochage (sélection multiple possible)
**Collègue :** même principe de cochage, ouvre Gmail avec les articles copiés
**Agence :** renvoyer le TPE, avec option de supprimer un article (num série), plusieurs, ou la ligne complète
**Supprimer :** suppression dans le Sheet via API, avec confirmation

---

## 14. MODE OFFLINE

### Ce qui fonctionne offline
| Fonction | Offline | Notes |
|----------|---------|-------|
| Vue tableau | oui | Données en cache (dernière synchro) |
| Scan barcode (ZXing) | oui | 100% local |
| OCR photo (Tesseract) | oui | 100% local, modèles en cache |
| Recherche dans le stock | oui | Sur données en cache |
| Panier email | oui | Accumulation en local |

### Ce qui est mis en file d'attente offline
| Fonction | Comportement |
|----------|-------------|
| Ajout d'article | Stocké localement -> envoyé à la reconnexion |
| Suppression | Stockée localement -> exécutée à la reconnexion |

### Indicateur visuel
- Bandeau discret en haut : *"Mode offline — X opérations en attente"*
- Disparaît à la reconnexion après synchronisation

---

## 15. REGLES METIER TPE

### Types d'étiquettes

| Format | Appareils | Barcode |
|--------|-----------|---------|
| Ingenico | Move5000, Desk1500/1600/5000, Desk5000CL2LSMBW, ICT250, IWL250/253, DX8000, POL-DESK5000, POL-DESK5000CL2LSMBW | 24 chiffres |
| PAX | A920PRO, P2PRO, A99CLAVIER, A99WIFI4GBT, POL-A99 | 10 caractères |
| IWL | IWL250, IWL253 | Alphanumérique mixte |

**Règle absolue :** prendre le long numéro sous le barcode. Ignorer S/N court (TCA...). Si illisible -> blanc + alerte, jamais de devinette.

### Associations TPE / Base

| Type | Comportement |
|------|-------------|
| MOVE5000, A920PRO, P2PRO, IWL250, IWL253 | TPE + Base -> même ligne |
| AXIUM DX8000 + BASE DX8000 | TPE et Base -> lignes séparées |
| DESK*, ICT250*, Q25, POL-* | Standalone, pas de base |
| BASE A920PRO, BASE A99, BASE DX8000 | Base seule |

### Banques
- **JDC** : majorité
- **CRCA31** : Crédit Agricole 31 (lu sur l'étiquette)

### Client
- Défaut : `MLSTECH / BARDOUX A.`
- Si étiquette dit RECEPTION : `RECEP. (RET. GARANTIE)` ou `RECEPTION`

---

## 16. ARCHITECTURE TECHNIQUE

### Fichiers de l'application
```
mysu/
├── index.html           -> structure + tableau principal
├── manifest.json        -> config PWA (nom MySU, icône, couleurs)
├── service-worker.js    -> cache offline (Tesseract models, ZXing, app shell)
├── app.js               -> logique principale + routing + onboarding
├── sheets.js            -> Google Sheets API v4 (lecture, écriture, suppression, tri)
├── scanner.js           -> ZXing-js (scan barcode temps réel)
├── ocr.js               -> Tesseract.js (OCR photo)
├── rules.js             -> schémas mémorisés (localStorage + Drive JSON)
├── clipboard.js         -> panier email + copier/coller formaté
├── offline.js           -> file d'attente offline + synchronisation
├── gestures.js          -> swipe droite/gauche + appui long (Hammer.js)
├── ui.js                -> tableau, suppression, formulaires, codes couleur
├── style.css            -> mise en forme responsive
└── icon.svg             -> icône MySU
```

### Hébergement
- **GitHub Pages** (gratuit, HTTPS automatique)
- Configuration GitHub : à faire en session avec Anthonny

---

## 17. PHASES DE DEVELOPPEMENT

### Phase 1 — Socle (priorité absolue)
- Structure PWA installable + icône MySU + manifest.json + service-worker.js
- OAuth2 Google (Sheets + Drive.file)
- Onboarding : détection inventaire existant / création premier fichier Sheet
- Affichage tableau depuis Google Sheet (Stock + Demandes)
- Gestes swipe (droite = sortie, gauche = retour/suppression)
- Appui long = ouvrir Google Sheet pour édition libre
- Codes couleur (vert = posé, gris = transféré, raillé = supprimé)
- Formulaire d'ajout manuel avec tri alphabétique auto
- Suppression simple et multi-sélection avec confirmation

### Phase 2 — Scan barcode
- ZXing-js, caméra temps réel
- Overlay 3/4 écran (tableau visible derrière)
- Reconnu -> proposer Poser / Transférer / Supprimer
- Non reconnu -> proposer ajout (formulaire pré-rempli si possible)

### Phase 3 — Sélection + Copier + Email
- Cochage multi-articles avec checkbox
- Bandeau d'action (Copier / Email / Annuler)
- Panier email cumulatif avec badge compteur
- Bouton Email -> copie bloc formaté + ouvre Gmail nativement
- Copier/coller natif pour utiliser n'importe où

### Phase 4 — OCR photo
- Tesseract.js, caméra ou galerie
- Score de confiance affiché, illisible = blanc + alerte
- Multi-articles (traitement séquentiel, confirmation un par un)
- Sauvegarde photo sur Drive (images floues gardées pour traitement ultérieur)

### Phase 5 — Avancé
- Mode apprentissage (étiquette inconnue -> mémorisation schéma)
- Offline : cache tableau + queue d'opérations + synchro au retour
- Paramétrage : ordre des colonnes, thème clair/sombre
- Guide premier lancement pour les collègues (onboarding complet)

---

## 18. CONNAISSANCE TERRAIN

A coder en règles initiales dès Phase 1 :

- Variantes SMBW (DESK5000CL2LSMBW, POL-DESK5000CL2LSMBW) -> valides, traiter comme leurs équivalents
- 2 barcodes sur étiquette Ingenico -> prendre le plus long (24 chiffres), ignorer TCA...
- Date format JJ/MM/AAAA
- Etiquette manuscrite -> déclencher mode apprentissage
- Barcode illisible -> laisser vide + alerter, ne jamais deviner
- Carton sans étiquette JDC -> ligne vide à compléter manuellement
- Tri alphabétique sur colonne A obligatoire à chaque insertion

---

## 19. DECISIONS CLES (validées le 07/04/2026)

| Décision | Raison |
|----------|--------|
| **Pas de Gmail API** | L'app prépare le contenu, l'utilisateur envoie lui-même via Gmail natif |
| **Pas d'email automatique** | L'utilisateur garde la main sur envoi, destinataire, moment |
| **2 scopes OAuth au lieu de 3** | Sheets + Drive.file suffisent (pas de Gmail scope) |
| **Pas de drag & drop** | Copier/coller natif + cochage multi-articles = plus fiable sur mobile |
| **Panier email cumulatif** | Accumule les articles au fil de la session, copie tout d'un coup |
| **Swipe + appui long** | Remplace les boutons ✕ simples par des gestes natifs mobile |
| **3 statuts couleur** | Vert (posé), gris (transféré), raillé (supprimé) = UX claire |
| **Onboarding multi-utilisateur** | Création auto du premier inventaire pour les collègues |
| **OCR validé à 90-95%** | Testé en sessions Cowork avec vraies étiquettes |

---

## 20. QUESTIONS CLOSES

| Question | Réponse |
|----------|---------|
| Email | Pas d'envoi automatique. Gmail natif. Panier cumulatif. |
| Vue tableau | Tout sur une page : Stock puis Demandes |
| Modification manuelle | Appui long ouvre Google Sheets dans le navigateur |
| Mode offline | Souhaité : scan/OCR offline + file d'attente synchro |
| Nom de l'app | MySU |
| Icône | Style "carton de stock" (icon.svg) |
| OCR | Tesseract.js local gratuit, testé à 90-95% |
| Historique sorties | Non, suppression simple |
| GitHub | A configurer ensemble en début de session dev |
| Drag & drop | Non, remplacé par cochage + copier/coller natif |
