# Connector Contracts

## Providers MVP

- PostgreSQL / Supabase read-only.
- Firebase / Firestore read-only.
- REST read-only.
- Webhook d'ingestion signe.
- Stripe read-only pour revenus de l'application analysee.
- Gateway read-only.

## Event Shape

```json
{
  "eventName": "first_photo_uploaded",
  "occurredAt": "2026-06-23T14:12:00Z",
  "actorId": "guest_123",
  "actorType": "guest",
  "entityId": "event_456",
  "entityType": "sample_project",
  "properties": {}
}
```

## Deduplication

Hash deterministe: `dataSourceId + externalId + eventName + occurredAt + entityId`.
