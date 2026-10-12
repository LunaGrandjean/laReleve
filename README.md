# LaRelève

Application interne de gestion opérationnelle pour centraliser le suivi des contacts, membres, offres, documents et chantiers.

## Auteur

Luna Grandjean Stefano

## Présentation

Ce dépôt contient l'application `lareleve-hub`, une interface React/Vite pensée pour organiser les données de LaRelève au même endroit :

- tableau de bord global ;
- contacts agences et entrepreneurs ;
- suivi des membres et recherches ;
- classement des offres et documents ;
- suivi chantier par opération, pièce, budget, commentaires et réunions.

## Structure

```text
lareleve-hub/
  public/        Fichiers statiques
  src/           Code source de l'application
  index.html    Point d'entrée Vite
```

## Installation

Depuis le dossier `lareleve-hub` :

```bash
npm install
```

## Lancement en local

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Configuration MongoDB

Pour activer les comptes utilisateurs et la sauvegarde cloud, copier `lareleve-hub/.env.example` vers `lareleve-hub/.env`, puis remplir :

```bash
MONGODB_URI=mongodb+srv://...
MONGODB_DB=lareleve
JWT_SECRET=une-longue-cle-secrete
ADMIN_EMAIL=ton-email
ADMIN_PASSWORD=ton-mot-de-passe-admin
ADMIN_NAME=Luna Grandjean
CLIENT_ORIGIN=http://localhost:8080
PORT=3001
```

Le compte admin est créé automatiquement au démarrage du serveur si `ADMIN_EMAIL` et `ADMIN_PASSWORD` sont renseignés.

Lancement local avec MongoDB :

```bash
cd lareleve-hub
npm install
npm run server
```

Puis dans un deuxième terminal :

```bash
cd lareleve-hub
npm run dev
```

Seul un compte `admin` voit l'onglet `Admin`, qui permet de créer les comptes utilisateurs et d'importer une sauvegarde JSON dans le compte choisi.

## Notes

Les données restent sauvegardées localement dans le navigateur, puis sont synchronisées vers MongoDB quand un utilisateur est connecté.
