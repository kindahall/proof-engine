import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { handleApiError } from "@/lib/api/errors"
import { ingestEventSchema } from "@/lib/connectors/schemas"
import {
  WebhookIngestionNotConfiguredError,
  ingestConnectorEvents,
} from "@/lib/connectors/service"
import { captureEvent } from "@/lib/observability/server"
import { verifyWebhookPayload } from "@/lib/security/webhook"

export async function POST(request: Request) {
  const body = await request.text()
  const verification = verifyWebhookPayload({
    body,
    projectKey: request.headers.get("x-proof-engine-project-key"),
    signature: request.headers.get("x-proof-engine-signature"),
  })

  if (!verification.ok) {
    const reason = verification.reason ?? "invalid_signature"
    captureEvent({
      level: "warn",
      event: "proof_engine.webhook_signature_rejected",
      route: "/api/ingest/events",
      operation: "POST",
      errorCode: reason,
    })
    return NextResponse.json({ ok: false, error: reason }, { status: 401 })
  }

  try {
    const parsedJson = JSON.parse(body) as unknown
    const events = Array.isArray(parsedJson) ? parsedJson : [parsedJson]
    const parsedEvents = events.map((event) => ingestEventSchema.parse(event))
    const result = await ingestConnectorEvents("ds_webhook", parsedEvents)

    return NextResponse.json({
      ok: true,
      received: parsedEvents.length,
      inserted: result.insertedCount,
      deduplicated: result.deduplicatedCount,
    })
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "invalid_payload", message: "Payload d'événement invalide." },
        { status: 400 },
      )
    }
    if (error instanceof WebhookIngestionNotConfiguredError) {
      return NextResponse.json(
        { ok: false, error: "webhook_connector_not_configured", message: error.message },
        { status: 409 },
      )
    }
    return handleApiError(error, { route: "/api/ingest/events", operation: "POST" })
  }
}
