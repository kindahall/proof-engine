# Plan d'implementation - Proof Engine

## Objectif

Transformer `proof-engine-next` en MVP local fonctionnel de Proof Engine, avec une boucle testable :

```text
connexion backend -> synchronisation -> mapping -> metriques -> preuves -> diagnostic -> experience -> resultats -> apprentissage
```

## Hypotheses

- `proof-engine-next` est l'application active.
- Le MVP local utilise des providers mock deterministes pour les tests et la CI.
- Les providers read-only PostgreSQL, Firebase, REST, Stripe et Gateway existent cote serveur avec une frontiere claire; les secrets reels ne sont pas requis pour executer les tests.
- Supabase local et RLS sont documentes et modelises par migrations SQL; le runtime local actuel reste memoire/mock tant que les variables Supabase ne sont pas fournies.

## Risques

- Brancher Supabase Auth + RLS complet dans le temps d'une passe peut casser l'app existante. Mitigation: fournir migrations, contrats, tests de regles deterministes et API mock compatible.
- Les connecteurs reels dependent de secrets absents. Mitigation: garder les providers read-only server-only et tester les mocks.
- Les versions installees sont recentes. Mitigation: verrouiller via `pnpm-lock.yaml` et verifier lint/typecheck/build.

## Tranches

1. Documentation et conventions
   - Creer `AGENTS.md` racine.
   - Creer le plan, docs Gateway, AI, securite, architecture et backlog.

2. Contrats runtime
   - Schemas Zod pour evenements, mappings, Gateway, diagnostics, experiences et apprentissages.
   - Chiffrement AES-GCM cote serveur.
   - Verification de signature webhook.

3. Connecteurs et Gateway
   - Provider mock deterministe.
   - Provider REST read-only minimal.
   - Structures PostgreSQL, Firebase, Stripe read-only.
   - Interface `GatewayProvider`, `MockGatewayProvider`, `HttpGatewayProvider` et providers prepares MCP/Codex/Hermes-style.

4. Synchronisation et metriques
   - Store memoire local pour les tests.
   - Deduplication par hash.
   - Mapping MYteuf source -> canonique.
   - Calcul funnel, metriques, data quality gate et preuves quantitatives.

5. API routes
   - Ingestion signee.
   - Test/sync connecteurs.
   - Test/inspect/sync Gateway.
   - Cron de sync.
   - Diagnostic, generation d'experience, suivi et cloture.

6. UI
   - Raccorder les assistants connecteur/Gateway aux endpoints.
   - Ajouter boutons de sync/action qui appellent le backend local.
   - Retirer le wording "frontend uniquement".

7. Tests
   - Unitaires: schemas, scoring, mappings, Gateway, dedup, decision, experience active.
   - E2E: parcours utilisateur principal sur UI avec providers mock.
   - Verification finale: `lint`, `typecheck`, `test`, `build`, puis `test:e2e` si les navigateurs Playwright sont disponibles.
