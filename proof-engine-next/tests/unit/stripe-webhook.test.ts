import Stripe from "stripe"
import { afterEach, describe, expect, it } from "vitest"
import { POST } from "@/app/api/webhooks/stripe/route"

const originalSecret = process.env.STRIPE_WEBHOOK_SECRET

describe("Stripe webhook route", () => {
  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret
  })

  it("verifies Stripe signatures when a webhook secret is configured", async () => {
    const secret = "whsec_test_secret"
    const payload = JSON.stringify({ id: "evt_test", object: "event", type: "payment_intent.succeeded" })
    process.env.STRIPE_WEBHOOK_SECRET = secret

    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    })

    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      }),
    )

    await expect(response.json()).resolves.toMatchObject({ ok: true, mode: "read_only" })
  })

  it("rejects invalid Stripe signatures when a webhook secret is configured", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret"

    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "invalid" },
        body: "{}",
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: "invalid_stripe_signature" })
  })
})
