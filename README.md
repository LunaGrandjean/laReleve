# LaRelève

Application interne de gestion opérationnelle pour centraliser le suivi des contacts, membres, offres, documents et chantiers.

## Auteur

Luna Grandjean

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

## Notes

Les données de l'application sont stockées localement dans le navigateur, notamment via `localStorage` et IndexedDB selon les fonctionnalités.
