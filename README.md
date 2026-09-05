# Proof Engine

Proof Engine is a Next.js application for evidence-first marketing diagnostics.
The active application lives in `proof-engine-next/`.

## Active App

```bash
cd proof-engine-next
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Production Notes

- Supabase Auth, persistence, RLS, encrypted connector secrets, Gateway profiles,
  OpenAI, Stripe webhooks, and server observability are implemented in the active
  app surface.
- Secrets must stay in local/deployment environment variables. `.env.local` is
  intentionally ignored.
- Supabase migrations live in `proof-engine-next/supabase/migrations/`.
- Run `pnpm supabase:check` from `proof-engine-next/` after applying migrations
  to verify that the Data API sees the expected schema.

## Repository Layout

- `proof-engine-next/` - active Next.js App Router product.
- `docs/` - root implementation notes.
- `AGENTS.md` - workspace instructions for coding agents.

Older local app attempts and design exports are intentionally ignored by Git.

## Support

If this project is useful to you, you can support its development with a free and entirely optional tip through the repository's **Sponsor** button. Thank you for your support.
