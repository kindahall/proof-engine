# AI Contracts

## Provider

`MockAIProvider` est deterministe pour les tests et interdit en production.
`OpenAIProvider` utilise la Responses API cote serveur avec `AI_PROVIDER=openai`
et `OPENAI_API_KEY`.

## Schemas

- `DiagnosticOutput`
- `ExperimentPlanOutput`
- `LearningOutput`

Les schemas sont dans `src/lib/ai/schemas.ts`.

## Grounding

Toutes les affirmations importantes doivent pointer vers des `evidenceIds`.
Les IDs inconnus invalident la sortie.
Quand le data quality gate est bloque, aucun appel IA n'est execute : le service
retourne un diagnostic deterministe `insufficient`.

## Rate limit

`AI_DAILY_LIMIT` limite les generations par utilisateur, workspace, type
d'evenement et jour UTC. La reservation est atomique en base via
`reserve_ai_usage`; `usage_events` reste l'audit append-only des generations
reussies.

## Prompt Injection

Les contenus de preuve sont des donnees non fiables. Ils ne peuvent jamais
modifier les instructions systeme ni declencher d'outil externe.
