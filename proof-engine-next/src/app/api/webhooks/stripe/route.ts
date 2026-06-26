import { NextResponse } from "next/server"
import Stripe from "stripe"
import { captureEvent } from "@/lib/observability/server"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()

  if (!webhookSecret && process.env.NODE_ENV === "production") {
    captureEvent({
      level: "error",
      event: "proof_engine.stripe_webhook_secret_missing",
      route: "/api/webhooks/stripe",
      operation: "POST",
    })
    return NextResponse.json({ ok: false, error: "stripe_webhook_secret_not_configured" }, { status: 500 })
  }

  if (webhookSecret) {
    if (!signature) {
      captureEvent({
        level: "warn",
        event: "proof_engine.stripe_signature_missing",
        route: "/api/webhooks/stripe",
        operation: "POST",
      })
      return NextResponse.json({ ok: false, error: "missing_stripe_signature" }, { status: 401 })
    }

    try {
      Stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch {
      captureEvent({
        level: "warn",
        event: "proof_engine.stripe_signature_rejected",
        route: "/api/webhooks/stripe",
        operation: "POST",
      })
      return NextResponse.json({ ok: false, error: "invalid_stripe_signature" }, { status: 401 })
    }
  }

  return NextResponse.json({
    ok: true,
    mode: "read_only",
    message: "Webhook Stripe recu pour mesure des revenus de l'application analysee.",
  })
}
