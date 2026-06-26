# AGENTS.md - Proof Engine

## Perimetre de ce depot

Ce depot contient l'application active Proof Engine, construite selon la spec
`proof-engine-codex-prompt-myteuf-backend-gateway.md`.

L'interface demarre vide pour `myteuf.com`. Aucun chiffre du projet cible ne doit etre
affiche tant que Firebase reel n'est pas connecte. Les tests internes utilisent
`ds_mock` et `gw_mock`, separes de l'UI utilisateur.

## Stack

- Next.js (App Router) + React + TypeScript strict
- Tailwind CSS v4 + shadcn/ui + Lucide
- next-themes, Recharts, Sonner
- pnpm

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Conventions

- Le nom du produit est centralise dans `src/config/product.ts`.
- Les routes sont centralisees dans `src/lib/routes.ts`.
- Les libelles et tons sont centralises dans `src/lib/mock/labels.ts`.
- Les contrats backend/Gateway sont dans `src/lib/connectors`, `src/lib/gateway`,
  `src/lib/analytics`, `src/lib/diagnostics` et `src/lib/ai`.
- Server Components par defaut; Client Components seulement quand
  l'interactivite l'exige.
- Texte d'interface en francais; code, types et fichiers en anglais.

## Invariants produit

- Separation stricte faits / signaux / hypotheses / inconnues.
- Une seule experience `running` a la fois.
- Connexion backend ou Gateway mock obligatoire avant diagnostic fiable.
- Aucune saisie manuelle de metriques ou de resultats.
- IA sans acces aux secrets; operations Gateway read-only.

## Verification

Avant de livrer une modification :

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
