import { NextResponse } from "next/server"
import { ZodError, z } from "zod"
import { handleApiError } from "@/lib/api/errors"
import { captureEvent, captureException } from "@/lib/observability/server"

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(4000),
  source: z.string().trim().max(120).optional(),
})

type ContactPayload = z.infer<typeof contactSchema>

function contactRecipient() {
  return process.env.CONTACT_EMAIL_TO?.trim() || "hello@proofengine.app"
}

function buildMailto(payload: ContactPayload) {
  const subject = encodeURIComponent(`Contact Proof Engine - ${payload.name}`)
  const body = encodeURIComponent(`${payload.message}\n\n${payload.name}\n${payload.email}`)
  return `mailto:${contactRecipient()}?subject=${subject}&body=${body}`
}

function configuredWebhookUrl() {
  const rawUrl = process.env.CONTACT_WEBHOOK_URL?.trim()
  if (!rawUrl) return null

  try {
    return new URL(rawUrl).toString()
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const payload = contactSchema.parse(await request.json())
    const mailto = buildMailto(payload)
    const webhookUrl = configuredWebhookUrl()

    if (!webhookUrl) {
      captureEvent({
        level: "warn",
        event: "proof_engine.contact_not_configured",
        route: "/api/contact",
        operation: "POST",
        errorCode: "contact_not_configured",
      })
      return NextResponse.json(
        {
          ok: false,
          error: "contact_not_configured",
          message: "Le canal contact n'est pas configuré sur ce déploiement.",
          mailto,
        },
        { status: 503 },
      )
    }

    const submittedAt = new Date().toISOString()
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (process.env.CONTACT_WEBHOOK_SECRET) {
      headers.Authorization = `Bearer ${process.env.CONTACT_WEBHOOK_SECRET}`
    }

    let response: Response
    try {
      response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...payload,
          source: payload.source ?? "marketing_contact_form",
          submittedAt,
        }),
      })
    } catch (error) {
      captureException(error, {
        route: "/api/contact",
        operation: "POST",
        event: "proof_engine.contact_delivery_error",
        errorCode: "contact_delivery_failed",
      })
      return NextResponse.json(
        {
          ok: false,
          error: "contact_delivery_failed",
          message: "Le canal contact ne répond pas pour le moment.",
          mailto,
        },
        { status: 502 },
      )
    }

    if (!response.ok) {
      captureEvent({
        level: "warn",
        event: "proof_engine.contact_delivery_rejected",
        route: "/api/contact",
        operation: "POST",
        errorCode: "contact_delivery_failed",
        metadata: { status: response.status },
      })
      return NextResponse.json(
        {
          ok: false,
          error: "contact_delivery_failed",
          message: "Le canal contact n'a pas confirmé la réception.",
          mailto,
        },
        { status: 502 },
      )
    }

    captureEvent({
      event: "proof_engine.contact_submitted",
      route: "/api/contact",
      operation: "POST",
      metadata: {
        source: payload.source ?? "marketing_contact_form",
        emailDomain: payload.email.split("@")[1] ?? null,
      },
    })
    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "invalid_payload", message: "Message de contact invalide." },
        { status: 400 },
      )
    }
    return handleApiError(error, { route: "/api/contact", operation: "POST" })
  }
}
