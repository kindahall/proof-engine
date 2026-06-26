#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

const ENV_FILES = [".env.local", ".env"]

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
]

const REQUIRED_TABLES = [
  "profiles",
  "workspaces",
  "workspace_members",
  "projects",
  "data_sources",
  "connector_secrets",
  "sync_runs",
  "connector_health_checks",
  "gateway_profiles",
  "gateway_secrets",
  "gateway_capability_checks",
  "gateway_tool_runs",
  "source_schemas",
  "event_mappings",
  "raw_events",
  "project_metrics",
  "metric_snapshots",
  "funnel_snapshots",
  "evidence_items",
  "diagnostics",
  "experiments",
  "experiment_assets",
  "experiment_measurements",
  "experiment_notes",
  "learnings",
  "ai_runs",
  "usage_events",
  "ai_usage_daily",
]

const AUTH_SMOKE_TABLES = [
  "profiles",
  "workspaces",
  "workspace_members",
  "projects",
  "data_sources",
  "gateway_profiles",
  "diagnostics",
  "experiments",
  "learnings",
  "ai_usage_daily",
]

const REQUIRED_COLUMN_CHECKS = [
  { table: "evidence_items", columns: "code" },
]

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName)
  if (!existsSync(filePath)) return

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#") || !line.includes("=")) continue

    const [rawKey, ...rawValue] = line.split("=")
    const key = rawKey.trim()
    if (!key || process.env[key] != null) continue

    process.env[key] = unquote(rawValue.join("=").trim())
  }
}

function unquote(value) {
  const quote = value[0]
  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1)
  }
  return value
}

function getMissingEnv() {
  return REQUIRED_ENV.filter((key) => !process.env[key]?.trim())
}

function makeClient(key) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function checkTable(client, table, columns = "*") {
  const { error } = await client.from(table).select(columns).limit(0)
  return {
    table,
    columns,
    ok: !error,
    code: error?.code ?? null,
    message: error?.message ?? null,
  }
}

function printFailures(title, failures) {
  if (failures.length === 0) return

  console.error(`\n${title}`)
  for (const failure of failures) {
    const target = failure.columns && failure.columns !== "*" ? `${failure.table}.${failure.columns}` : failure.table
    console.error(`- ${target}: ${failure.code ?? "unknown"} ${failure.message ?? ""}`.trim())
  }
}

function printSchemaAdvice(failures) {
  const schemaCacheFailures = failures.filter((failure) => failure.code === "PGRST205")
  if (schemaCacheFailures.length === 0) return

  console.error("\nSupabase Data API ne voit pas encore ces tables.")
  console.error("Appliquez les migrations et rechargez le cache PostgREST, puis relancez ce check :")
  console.error("  pnpm exec supabase login")
  console.error("  pnpm exec supabase link --project-ref kegwmanuetudhkycnhdu")
  console.error("  pnpm exec supabase db push")
  console.error("  pnpm supabase:check")
  console.error("Verifiez aussi que le schema public est expose dans les reglages Data API du projet.")
}

async function runAuthenticatedSmoke(publicClient) {
  const email = process.env.E2E_AUTH_EMAIL?.trim()
  const password = process.env.E2E_AUTH_PASSWORD?.trim()

  if (!email || !password) {
    console.log("Auth smoke: ignore (E2E_AUTH_EMAIL/E2E_AUTH_PASSWORD non renseignes).")
    return []
  }

  const { error: signInError } = await publicClient.auth.signInWithPassword({ email, password })
  if (signInError) {
    return [
      {
        table: "auth.signInWithPassword",
        ok: false,
        code: signInError.code ?? signInError.status?.toString() ?? "auth_error",
        message: signInError.message,
      },
    ]
  }

  const checks = await Promise.all(AUTH_SMOKE_TABLES.map((table) => checkTable(publicClient, table)))
  await publicClient.auth.signOut()
  return checks.filter((result) => !result.ok)
}

async function main() {
  ENV_FILES.forEach(loadEnvFile)

  const missing = getMissingEnv()
  if (missing.length > 0) {
    console.error(`Variables Supabase manquantes: ${missing.join(", ")}`)
    process.exit(1)
  }

  const adminClient = makeClient(process.env.SUPABASE_SECRET_KEY)
  const publicClient = makeClient(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

  console.log(`Schema check: ${REQUIRED_TABLES.length} tables via Supabase Data API.`)
  const tableChecks = await Promise.all(REQUIRED_TABLES.map((table) => checkTable(adminClient, table)))
  const tableFailures = tableChecks.filter((result) => !result.ok)
  const columnChecks = await Promise.all(
    REQUIRED_COLUMN_CHECKS.map((check) => checkTable(adminClient, check.table, check.columns)),
  )
  const columnFailures = columnChecks.filter((result) => !result.ok)

  printFailures("Tables inaccessibles avec la cle serveur:", tableFailures)
  printFailures("Colonnes inaccessibles avec la cle serveur:", columnFailures)
  printSchemaAdvice(tableFailures)

  if (tableFailures.length === 0) {
    console.log("Tables serveur: OK.")
  }
  if (columnFailures.length === 0) {
    console.log("Colonnes serveur: OK.")
  }

  const authFailures = await runAuthenticatedSmoke(publicClient)
  printFailures("Smoke auth/RLS echoue:", authFailures)

  if (authFailures.length === 0) {
    console.log("Auth/RLS smoke: OK.")
  }

  process.exit(tableFailures.length || columnFailures.length || authFailures.length ? 1 : 0)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
