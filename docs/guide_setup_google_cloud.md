# Guide de configuration Google Cloud Console pour MySU

Ce guide est à suivre **une seule fois** par le mainteneur de l'app (pas par chaque utilisateur).
Les collègues n'ont qu'à ouvrir l'app et se connecter avec leur compte Google.

---

## Etape 1 — Accéder à Google Cloud Console

1. Ouvre **console.cloud.google.com**
2. Connecte-toi avec le compte Google qui administre l'app

---

## Etape 2 — Créer un projet

1. En haut à gauche, clique sur le sélecteur de projet (à côté de "Google Cloud")
   - Si tu vois "Aucune organisation", c'est normal
2. Clique sur **"Nouveau projet"**
3. Nom du projet : **MySU**
4. Organisation : laisse par défaut
5. Clique **"Créer"**
6. **Important :** après création, re-clique sur le sélecteur en haut à gauche et sélectionne **MySU** pour le rendre actif

---

## Etape 3 — Activer les 3 APIs

Menu ☰ → **API et services** → **Bibliothèque**

Cherche et active chacune de ces APIs :

1. **Google Sheets API** → Activer
2. **Google Drive API** → Activer
3. **Google Picker API** → Activer

---

## Etape 4 — Configurer l'écran de consentement OAuth

1. Menu ☰ → **API et services** → **Écran de consentement OAuth**
2. Si on demande Interne/Externe → choisir **Externe**
3. Remplir :
   - Nom de l'application : `MySU`
   - Email assistance utilisateur : ton adresse email
4. Suivant → continuer jusqu'à "Créer"

---

## Etape 5 — Créer les identifiants OAuth (Client ID)

1. Menu ☰ → **API et services** → **Identifiants**
2. **Créer des identifiants** → **ID client OAuth**
3. Type d'application : **Application Web**
4. Nom : `MySU Web`
5. **Origines JavaScript autorisées** → + Ajouter un URI :
   - `http://localhost:8080` (pour le dev)
   - Ajouter aussi l'URL GitHub Pages quand l'app sera en ligne
6. **URI de redirection autorisées** → + Ajouter un URI :
   - `http://localhost:8080`
   - Ajouter aussi l'URL GitHub Pages quand l'app sera en ligne
7. Clique **"Créer"**
8. Note le **ID client** (finit par `.apps.googleusercontent.com`) — c'est la seule valeur nécessaire pour l'app
9. Le code secret n'est pas nécessaire pour une PWA

---

## Etape 6 — Ajouter des utilisateurs de test

Tant que l'app n'est pas vérifiée par Google, seuls les comptes listés ici peuvent se connecter.

1. Menu ☰ → **API et services** → **Écran de consentement OAuth**
2. Dans le menu latéral gauche → **Audience**
3. Section **Utilisateurs tests** → **+ Ajouter**
4. Ajoute les adresses email des testeurs
5. Enregistre

Pour ajouter de nouveaux testeurs plus tard, reviens à cet endroit.

---

## Résumé des infos à retenir

| Info | Valeur |
|------|--------|
| Projet Google Cloud | MySU |
| APIs activées | Sheets, Drive, Picker |
| Type OAuth | Application Web, Externe |
| Client ID | (noté dans la config de l'app) |
| Scopes utilisés | `spreadsheets` + `drive.file` |
