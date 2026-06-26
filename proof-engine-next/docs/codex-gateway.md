# Codex Gateway

## Developpement local

1. Creer un profil Gateway HTTP sans commiter de token.
2. Renseigner l'endpoint HTTP et le token dans le formulaire Gateway.
3. Tester la configuration non persistée via `POST /api/gateway/test`.
4. Sauvegarder le profil via `POST /api/gateway`.
5. Tester avec `POST /api/gateway/{gatewayConnectionId}/test`.
6. Inspecter avec `POST /api/gateway/{gatewayConnectionId}/inspect-schema`.
7. Synchroniser avec `POST /api/gateway/{gatewayConnectionId}/sync`.

Le endpoint `POST /api/mcp/proof-engine-gateway` expose aussi un Gateway interne
read-only pour les operations Proof Engine (`health.check`, `schema.inspect`,
`events.read`, `metrics.read`, `funnels.compute`). Il ne s'appuie pas sur le
provider mock en production.

## Variables

```env
CONNECTOR_GATEWAY_ENABLED=true
GATEWAY_REQUEST_TIMEOUT_MS=15000
CODEX_GATEWAY_PROFILE=
TEST_GATEWAY_PROFILE_JSON=
```

## Regles

- Ne jamais commiter de token.
- Ne jamais donner a l'IA un acces SQL libre.
- Utiliser uniquement les operations typees du Gateway.
- Tester le mapping avec le provider mock uniquement en CI/developpement local.
- Les providers MCP/Codex/Hermes restent explicitement bloques tant que leur
  transport read-only n'est pas implemente.
