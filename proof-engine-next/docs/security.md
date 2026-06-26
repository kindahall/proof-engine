# Security

## Secrets

- `APP_ENCRYPTION_KEY` chiffre les secrets AES-GCM.
- Aucun secret n'est transmis au navigateur.
- Les exemples de profil Gateway sont factices.

## Autorisation

Les migrations Supabase activent RLS sur les tables metier. Les policies
s'appuient sur `workspace_members`.

## Headers HTTP

Next.js applique des headers de base sur toutes les routes : CSP, refus
d'iframe (`frame-ancestors 'none'` et `X-Frame-Options: DENY`), `nosniff`,
`Referrer-Policy` et `Permissions-Policy` restrictive.

## Connecteurs

Tous les providers connectes sont read-only. Les operations d'ecriture dans les
backends analyses sont interdites.

## Export de donnees

`GET /api/settings/export` exige une session utilisateur et exporte le snapshot
du workspace courant sans inclure les secrets de connecteurs ou de Gateway
(`connector_secrets`, `gateway_secrets`, tokens, service accounts ou chaines de
connexion).

## Webhooks

`POST /api/ingest/events` verifie la cle projet et la signature HMAC SHA-256.
`POST /api/webhooks/stripe` exige `STRIPE_WEBHOOK_SECRET` en production.
Le cron de synchronisation exige `CONNECTOR_SYNC_CRON_SECRET` en production.

## IA

Le provider IA n'obtient que des donnees filtrees et validees, jamais de secrets.
`AI_PROVIDER=mock` est interdit en production. Le quota journalier utilise
`ai_usage_daily` et les fonctions SQL `reserve_ai_usage` / `release_ai_usage`
pour reserver atomiquement une generation avant l'appel OpenAI. Une reservation
est relachee uniquement si le provider echoue avant de produire une reponse.

## Observabilite

Les erreurs serveur passent par une journalisation structuree JSON côté serveur.
Les champs sensibles (`token`, `secret`, `password`, `signature`, `cookie`,
`authorization`, `key`) sont masques avant ecriture. Definir
`OBSERVABILITY_DISABLED=true` coupe ces logs pour un environnement de test
specifique. Definir `OBSERVABILITY_INCLUDE_STACK=true` ajoute les stacks aux
logs serveur locaux ou de staging.
