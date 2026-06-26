# Gateway Contracts

## Interface

```ts
interface GatewayProvider {
  testConnection(input): Promise<GatewayHealthResult>
  listCapabilities(input): Promise<GatewayCapability[]>
  inspectSchema(input): Promise<GatewaySchemaResult>
  readEvents(input): Promise<SourceEvent[]>
  readEntities(input): Promise<Record<string, unknown>[]>
  readMetrics(input): Promise<MetricSnapshot[]>
}
```

## Providers

- `MockGatewayProvider`: utilise des fixtures internes generiques en CI et dev local.
- `HttpGatewayProvider`: appelle un endpoint HTTP securise avec bearer token.
- `PreparedGatewayProvider`: structure MCP, Codex MCP et Hermes-style sans
  supposer une API externe. Il retourne `blocked` tant que le transport reel
  n'est pas cable, et ne renvoie jamais de fixtures.

## Capabilities minimales

`schema.inspect`, `events.read`, `entities.read`, `metrics.read`, `health.check`.

## Interdit

`data.write`, `data.delete`, `campaign.send`, `email.send`, `payment.modify`,
`backend.mutate`.

## Securite

Les tokens sont chiffres cote serveur, jamais transmis aux composants client.
Toutes les sorties HTTP Gateway sont validees par Zod avant usage.
