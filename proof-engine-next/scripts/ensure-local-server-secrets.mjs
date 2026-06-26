#!/usr/bin/env node
import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const targetPath = resolve(process.cwd(), ".env.local")
const generated = new Set()

const managedDefaults = {
  APP_ENCRYPTION_KEY: () => randomBytes(32).toString("base64url"),
  CONNECTOR_WEBHOOK_SECRET: () => randomBytes(32).toString("base64url"),
  CONNECTOR_WEBHOOK_PROJECT_KEY: () => `pe_${randomBytes(18).toString("base64url")}`,
  CONNECTOR_SYNC_CRON_SECRET: () => randomBytes(32).toString("base64url"),
  GATEWAY_ALLOWED_PROVIDERS: () => "http_gateway,mcp_gateway,codex_mcp_gateway,hermes_style_gateway",
}

function parseEnv(content) {
  const values = new Map()
  for (const rawLine of content.split(/\r?\n/)) {
    const index = rawLine.indexOf("=")
    if (index <= 0 || rawLine.trim().startsWith("#")) continue
    values.set(rawLine.slice(0, index), rawLine.slice(index + 1))
  }
  return values
}

function upsertEnv(content, key, value) {
  const lines = content.split(/\r?\n/)
  const index = lines.findIndex((line) => line.startsWith(`${key}=`))
  if (index >= 0) {
    lines[index] = `${key}=${value}`
    return lines.join("\n")
  }

  const normalized = content.endsWith("\n") || content.length === 0 ? content : `${content}\n`
  return `${normalized}${key}=${value}\n`
}

let content = existsSync(targetPath) ? readFileSync(targetPath, "utf8") : ""
const values = parseEnv(content)

for (const [key, factory] of Object.entries(managedDefaults)) {
  const current = values.get(key)?.trim()
  const shouldReplaceGatewayProviders = key === "GATEWAY_ALLOWED_PROVIDERS" && (!current || current.includes("mock_gateway"))
  if (current && !shouldReplaceGatewayProviders) continue

  content = upsertEnv(content, key, factory())
  generated.add(key)
}

writeFileSync(targetPath, content, { mode: 0o600 })

if (generated.size === 0) {
  console.log("Server secrets: OK.")
} else {
  console.log(`Server secrets: ${[...generated].join(", ")} updated in .env.local.`)
}
