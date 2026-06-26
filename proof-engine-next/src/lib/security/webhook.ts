import { createHmac, timingSafeEqual } from "node:crypto"
import { connectorConfig } from "@/config/connectors"

function expectedProjectKey() {
  const projectKey = process.env.CONNECTOR_WEBHOOK_PROJECT_KEY?.trim()
  if (projectKey) return projectKey
  if (process.env.NODE_ENV === "production") {
    throw new Error("CONNECTOR_WEBHOOK_PROJECT_KEY is required in production.")
  }
  return connectorConfig.webhookProjectKey
}

function webhookSecret() {
  const secret = process.env.CONNECTOR_WEBHOOK_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === "production") {
    throw new Error("CONNECTOR_WEBHOOK_SECRET is required in production.")
  }
  return "proof-engine-local-webhook-secret"
}

export function signWebhookPayload(body: string) {
  return createHmac("sha256", webhookSecret()).update(body).digest("hex")
}

export function verifyWebhookPayload({
  body,
  projectKey,
  signature,
}: {
  body: string
  projectKey: string | null
  signature: string | null
}) {
  if (projectKey !== expectedProjectKey()) {
    return { ok: false, reason: "invalid_project_key" as const }
  }
  if (!signature) {
    return { ok: false, reason: "missing_signature" as const }
  }

  const expected = signWebhookPayload(body)
  const actual = signature.replace(/^sha256=/, "")
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(actual)

  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return { ok: false, reason: "invalid_signature" as const }
  }

  return { ok: true, reason: null }
}
