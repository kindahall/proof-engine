# Architecture

## Frontieres

- UI: `src/app`, `src/components`, `src/features`.
- API serveur: `src/app/api`.
- Connecteurs: `src/lib/connectors`.
- Gateway: `src/lib/gateway`.
- Metriques: `src/lib/analytics`.
- Diagnostic et decision: `src/lib/diagnostics`.
- IA: `src/lib/ai`.

## Flux

```text
source read-only -> sync -> raw_events -> mapping -> metric_snapshots -> evidence -> diagnostic -> experiment -> learning
```

## Runtime

Quand Supabase est configure, les routes et pages serveur lisent/ecrivent le
runtime dans les tables Supabase (`data_sources`, `raw_events`,
`project_metrics`, `evidence_items`, `diagnostics`, `experiments`,
`learnings`). Le store memoire reste limite aux tests et au mode local sans
Supabase.

## Serveur / client

Les secrets, providers admin, chiffrement, Gateway et synchronisation restent
cote serveur. Les composants client appellent uniquement des routes API typees.
