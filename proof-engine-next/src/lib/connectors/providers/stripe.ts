import Stripe from "stripe"
import { sourceEventSchema, type SourceEvent } from "@/lib/connectors/schemas"

type StripeObject = Record<string, unknown>

export class StripeReadOnlyConnectorProvider {
  constructor(private readonly secretKey: string) {}

  async testConnection() {
    const stripe = new Stripe(this.secretKey)
    await stripe.balance.retrieve()
    return {
      ok: true,
      status: "healthy" as const,
      latencyMs: 0,
      message: "Stripe read-only accessible pour les revenus de l'application analysee.",
    }
  }

  async readEvents(limit = 100): Promise<SourceEvent[]> {
    const stripe = new Stripe(this.secretKey)
    const events = await stripe.events.list({
      limit: Math.min(limit, 100),
      types: [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.deleted",
        "payment_intent.created",
        "payment_intent.succeeded",
      ],
    })

    return events.data.map((event) => toSourceEvent(event))
  }
}

function toSourceEvent(event: Stripe.Event): SourceEvent {
  const object = event.data.object as unknown as StripeObject
  const customer = readString(object.customer ?? object.customer_email ?? object.client_reference_id, "stripe")
  const entityId = readString(object.id, event.id)
  const entityType = readString(object.object, "stripe_object")

  return sourceEventSchema.parse({
    externalId: event.id,
    eventName: event.type,
    occurredAt: new Date(event.created * 1000).toISOString(),
    actorId: customer,
    actorType: customer === "stripe" ? "system" : "guest",
    entityId,
    entityType,
    properties: {
      stripeType: event.type,
      livemode: event.livemode,
      amount: readNumber(object.amount ?? object.amount_total ?? object.amount_received),
      currency: readString(object.currency, ""),
      status: readString(object.status, ""),
      mode: readString(object.mode, ""),
      metadata: object.metadata ?? {},
    },
  })
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : null
}
