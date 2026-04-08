# CONTEXTE DE TRAVAIL — Inventaire TPE
*À uploader en début de session pour reprendre le travail*

---

## 1. OBJECTIF
Anthonny te donne des photos d'étiquettes collées sur des cartons de TPE. Tu dois :
1. Extraire les données de chaque photo (produit, numéro de série, banque, date, client)
2. Ajouter ou supprimer les lignes dans le Google Sheet en temps réel via Chrome

---

## 2. GOOGLE SHEET
- **Compte :** anthonny.bardoux@jdc.fr
- **URL :** `https://docs.google.com/spreadsheets/d/1aAb7IEjb8XIrEI6R2oiLGr7po31sN8Fn/edit`
- **Note :** si le compte principal du navigateur est contact.absolu@gmail.com, utiliser `/u/1/` dans l'URL
- **Onglet :** "Inventaire TPE"

---

## 3. STRUCTURE DU FICHIER

### Tableau 1 — Stock (commence ligne 1)
| A : Produit | B : TPE | C : Base | D : Banque | E : Date | F : Client |
- Trié alphabétiquement par colonne A
- Insertion : toujours au bon rang alphabétique (utiliser clic droit → insérer ligne au-dessus)

### Séparation : 1 ligne vide

### Tableau 2 — Demandes d'intervention
| A : Demande | B : Compte | C : Raison Sociale |

---

## 4. RÈGLES DE LECTURE DES ÉTIQUETTES

### Règle fondamentale
**Toujours prendre le long numéro sous le code-barres.** Ignorer le S/N court (format TCA...), numéro de modèle, etc.

### Format Ingenico (Move5000, Desk1500/1600/5000, ICT250, IWL, DX8000)
- Code-barres = **24 chiffres** numériques
- Exemple : `220987303251170524463880`

### Format PAX (A920PRO, P2PRO, A99CLAVIER, A99WIFI4GBT)
- Code-barres = **10 caractères** courts
- Exemple : `1850328645`

### Format IWL (IWL250, IWL253)
- Code-barres = **alphanumérique mixte**
- Exemple : `18303BWL844971405`

---

## 5. TYPES D'APPAREILS

### TPE + Base sur la MÊME ligne
MOVE5000, A920PRO, P2PRO, IWL250, IWL253

### TPE et Base sur lignes SÉPARÉES
AXIUM DX8000 (TPE) + BASE DX8000 (Base)

### Standalone (TPE seul, pas de base)
DESK1500, DESK1600, DESK5000CL2L, DESK5000CL2LSMBW, ICT250PCIV3, Q25, POL-DESK5000, POL-DESK5000CL2LSMBW, POL-A99

### Bases seules
BASE A920PRO, BASE A99, BASE DX8000

---

## 6. RÈGLES MÉTIER

- **Banque :** JDC (majorité) ou CRCA31 (lisible sur étiquette)
- **Client par défaut :** `MLSTECH / BARDOUX A.`
- **Exception client :** si étiquette dit RECEPTION → `RECEP. (RET. GARANTIE)` ou `RECEPTION`
- **Barcode illisible :** laisser cellule vide + prévenir Anthonny, ne jamais deviner
- **Variantes SMBW :** DESK5000CL2LSMBW et POL-DESK5000CL2LSMBW sont des variantes valides, les saisir tels quels

---

## 7. PROCÉDURE DE SAISIE DANS CHROME

**Problème connu :** le Tab ne fonctionne pas pour naviguer entre colonnes.
**Solution :** utiliser la Name Box (en haut à gauche) pour aller à chaque cellule :
1. Cliquer sur la Name Box
2. Taper ex : `B22` + Entrée
3. Taper la valeur + Entrée
4. Recommencer pour chaque colonne

**Pour insérer une ligne :**
- Sélectionner le numéro de ligne (clic sur le chiffre à gauche)
- Clic droit → "Insérer une ligne au-dessus"

---

## 8. ERREURS À ÉVITER
1. Ne jamais ajouter d'articles au Tableau 2 (réservé aux demandes d'intervention)
2. Ne pas confondre S/N court et code-barres long
3. Ne jamais deviner un barcode flou — laisser vide et signaler
4. Toujours vérifier la position alphabétique avant insertion
5. Ne pas utiliser Tab pour naviguer entre colonnes dans Chrome

---

## 9. WORKFLOW TYPE

1. Anthonny envoie une ou plusieurs photos
2. Identifier : quel produit, quel type d'étiquette
3. Extraire : barcode TPE, barcode Base (si applicable), banque, date, client
4. Ouvrir Chrome sur le sheet, insérer la ligne au bon endroit alphabétique
5. Saisir cellule par cellule via Name Box
6. Prendre screenshot de vérification
7. Si barcode illisible → signaler et laisser vide
