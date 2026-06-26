#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const ENV_FILES = [".env.local", ".env"]

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "APP_ENCRYPTION_KEY",
  "CONNECTOR_WEBHOOK_SECRET",
  "CONNECTOR_WEBHOOK_PROJECT_KEY",
  "CONNECTOR_SYNC_CRON_SECRET",
  "STRIPE_WEBHOOK_SECRET",
  "AI_PROVIDER",
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
  if ((quote === '"' || quote === "'") && value.at(-1) === quote) return value.slice(1, -1)
  return value
}

function env(key) {
  return process.env[key]?.trim() ?? ""
}

function jwtRole(value) {
  if (!value.startsWith("eyJ")) return null
  const [, payload] = value.split(".")
  if (!payload) return null

  try {
    const decoded = Buffer.from(payload.replaceAll("-", "+").replaceAll("_", "/"), "base64url").toString("utf8")
    const parsed = JSON.parse(decoded)
    return typeof parsed.role === "string" ? parsed.role : null
  } catch {
    return null
  }
}

function addMissing(failures, key) {
  if (!env(key)) failures.push(`${key} est requis en production.`)
}

function main() {
  ENV_FILES.forEach(loadEnvFile)

  const failures = []
  for (const key of REQUIRED) addMissing(failures, key)

  if (env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") === env("SUPABASE_SECRET_KEY")) {
    failures.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ne doit jamais être égal à SUPABASE_SECRET_KEY.")
  }

  if (jwtRole(env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")) === "service_role") {
    failures.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contient une clé service_role.")
  }

  const appKey = env("APP_ENCRYPTION_KEY")
  if (appKey && appKey.length < 32) {
    failures.push("APP_ENCRYPTION_KEY doit contenir au moins 32 caractères.")
  }

  if (env("CONNECTOR_WEBHOOK_PROJECT_KEY") === "demo-project-key") {
    failures.push("CONNECTOR_WEBHOOK_PROJECT_KEY ne doit pas utiliser la valeur de démo en production.")
  }

  const aiProvider = env("AI_PROVIDER")
  if (aiProvider === "mock") {
    failures.push("AI_PROVIDER=mock est interdit en production.")
  }
  if (aiProvider === "openai" && !env("OPENAI_API_KEY")) {
    failures.push("OPENAI_API_KEY est requis avec AI_PROVIDER=openai.")
  }
  if (aiProvider && aiProvider !== "openai") {
    failures.push("AI_PROVIDER doit être openai en production.")
  }

  const dailyLimit = Number(env("AI_DAILY_LIMIT") || 20)
  if (!Number.isFinite(dailyLimit) || dailyLimit < 1) {
    failures.push("AI_DAILY_LIMIT doit être un nombre positif.")
  }

  const gatewayTimeout = Number(env("GATEWAY_REQUEST_TIMEOUT_MS") || 15_000)
  if (!Number.isFinite(gatewayTimeout) || gatewayTimeout < 1000) {
    failures.push("GATEWAY_REQUEST_TIMEOUT_MS doit être >= 1000.")
  }

  const gatewayProviders = (env("GATEWAY_ALLOWED_PROVIDERS") || "")
    .split(",")
    .map((provider) => provider.trim())
    .filter(Boolean)
  if (gatewayProviders.length === 0) {
    failures.push("GATEWAY_ALLOWED_PROVIDERS doit contenir au moins un provider de production.")
  }
  if (gatewayProviders.includes("mock_gateway")) {
    failures.push("GATEWAY_ALLOWED_PROVIDERS ne doit pas contenir mock_gateway en production.")
  }

  if (env("NEXT_PUBLIC_ANALYTICS_ENABLED") === "true" && !env("NEXT_PUBLIC_SEGMENT_WRITE_KEY")) {
    failures.push("NEXT_PUBLIC_SEGMENT_WRITE_KEY est requis quand NEXT_PUBLIC_ANALYTICS_ENABLED=true.")
  }

  if (failures.length > 0) {
    console.error("Production readiness: échec.")
    for (const failure of failures) console.error(`- ${failure}`)
    process.exit(1)
  }

  console.log("Production readiness: OK.")
}

main()
