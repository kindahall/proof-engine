# Proof Engine

SaaS **Proof Engine** : « Arrêtez de faire du marketing à l'aveugle ».

L'interface démarre vide : aucun chiffre n'est calculé avant connexion et
synchronisation d'une source réelle. Les tests internes utilisent un connecteur
mock et un Gateway mock read-only isolés de l'UI. Les providers PostgreSQL,
Supabase/Postgres, Firebase, REST, webhook, Stripe et Gateway HTTP/MCP sont
structurés côté serveur pour les branchements read-only.

En production, les providers mock sont refuses cote service et le check de
production interdit `AI_PROVIDER=mock` ainsi que `mock_gateway`.

## Stack

Next.js (App Router) · React · TypeScript strict · Tailwind v4 · shadcn/ui ·
Lucide · next-themes · Recharts · pnpm.

## Démarrage

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Scripts

```bash
pnpm dev          # développement
pnpm build        # build de production
pnpm start        # serveur de production
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest
pnpm test:e2e     # Playwright
pnpm supabase:check # vérifie que la Data API voit le schéma Proof Engine
pnpm secrets:ensure # génère les secrets serveur internes dans .env.local
pnpm production:check # vérifie les prérequis de production
```

## Pages

- **Marketing** : `/`, `/privacy`, `/terms`
- **Auth** : `/login`, `/signup`
- **Onboarding** : `/app/onboarding`
- **Espace projet** : `dashboard`, `evidence`, `diagnostic`, `experiments`,
  `learnings`, `connectors`, `gateway`, `event-mapping`, `data-quality`
- **Paramètres** : `/app/myteuf/settings`

## Variables

Copier `.env.example` puis renseigner les secrets réels uniquement côté serveur.
Le MVP local fonctionne avec `AI_PROVIDER=mock` et sans secrets externes.

L'analytics marketing est désactivé par défaut. Pour envoyer les pages vues et
les événements d'intention d'abonnement à Segment, définir
`NEXT_PUBLIC_ANALYTICS_ENABLED=true` et `NEXT_PUBLIC_SEGMENT_WRITE_KEY`.

## Supabase

Les migrations sont dans `supabase/migrations/`. Elles définissent les tables,
RLS, index et la contrainte d'une seule expérience `running` par projet.

Pour connecter un projet Supabase distant :

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref kegwmanuetudhkycnhdu
pnpm exec supabase db push
pnpm supabase:check
```

Le check utilise `SUPABASE_SECRET_KEY` côté serveur et ne journalise jamais les
clés. Si une table remonte `PGRST205`, les migrations ne sont pas appliquées ou
la table n'est pas exposée à la Data API.

## Documentation

- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/connector-contracts.md`
- `docs/gateway-contracts.md`
- `docs/codex-gateway.md`
- `docs/ai-contracts.md`
- `docs/security.md`
- `docs/backlog.md`
