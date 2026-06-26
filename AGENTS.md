# AGENTS.md - Proof Engine Workspace

## Scope

This workspace contains the Proof Engine specification and multiple app attempts. The active application is `proof-engine-next`.

Do not build new product work in `frontend/` or `proof-engine-app/` unless the user explicitly asks for those folders. They are older Vite surfaces.

## Active App

- Directory: `proof-engine-next/`
- Stack: Next.js App Router, React, TypeScript strict, Tailwind CSS v4, shadcn/ui, pnpm.
- Product language: French.
- Code, filenames, types and database objects: English.

## Commands

Run from `proof-engine-next/`:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Product Invariants

- Evidence first: important claims must cite evidence IDs or synchronized metrics.
- Manual metrics are forbidden as source of truth.
- Connectors and Gateway providers are read-only in the MVP.
- Secrets stay server-side and encrypted at rest.
- The AI layer interprets validated data; deterministic rules decide confidence and outcomes.
- One project can have only one `running` experiment.

## Files

- Root implementation plan: `docs/implementation-plan.md`
- App docs and contracts: `proof-engine-next/docs/`
- Runtime contracts: `proof-engine-next/src/lib/connectors`, `proof-engine-next/src/lib/gateway`, `proof-engine-next/src/lib/analytics`
- API routes: `proof-engine-next/src/app/api`

## Verification

Before handing back app work, run at minimum:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run `pnpm test:e2e` when UI routes or end-to-end behavior changed.
