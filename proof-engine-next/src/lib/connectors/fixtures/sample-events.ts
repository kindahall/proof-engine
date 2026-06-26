import type { SourceEvent } from "@/lib/connectors/schemas"

const baseDate = Date.UTC(2026, 5, 1, 8, 0, 0)

function iso(day: number, hourOffset = 0) {
  return new Date(baseDate + day * 86_400_000 + hourOffset * 3_600_000).toISOString()
}

function event(input: Omit<SourceEvent, "properties"> & { properties?: SourceEvent["properties"] }): SourceEvent {
  return {
    properties: {},
    ...input,
  }
}

export function getSampleFixtureEvents(): SourceEvent[] {
  const events: SourceEvent[] = []

  for (let index = 1; index <= 100; index += 1) {
    const suffix = String(index).padStart(3, "0")
    const entityId = `sample_${suffix}`
    const organizerId = `org_${suffix}`
    const day = index % 28
    const projectType = index % 5 === 0 ? "team_event" : index % 3 === 0 ? "customer_event" : "private_event"
    const device = index % 4 === 0 ? "desktop" : "mobile"

    events.push(
      event({
        externalId: `created_${suffix}`,
        eventName: "sample_project_created",
        occurredAt: iso(day),
        actorId: organizerId,
        actorType: "organizer",
        entityId,
        entityType: "sample_project",
        properties: { projectType, device },
      }),
    )

    if (index <= 61) {
      events.push(
        event({
          externalId: `action_${suffix}`,
          eventName: "share_surface_viewed",
          occurredAt: iso(day, 1),
          actorId: organizerId,
          actorType: "organizer",
          entityId,
          entityType: "sample_project",
          properties: { projectType, device },
        }),
      )
    }

    if (index <= 42) {
      const shareEvent = index % 2 === 0 ? "message_share_clicked" : "link_copied"
      events.push(
        event({
          externalId: `share_${suffix}`,
          eventName: shareEvent,
          occurredAt: iso(day, 2),
          actorId: organizerId,
          actorType: "organizer",
          entityId,
          entityType: "sample_project",
          properties: { projectType, device, channel: shareEvent === "message_share_clicked" ? "message" : "link" },
        }),
      )
    }

    if (index <= 39) {
      events.push(
        event({
          externalId: `guest_${suffix}`,
          eventName: "guest_joined",
          occurredAt: iso(day, 4),
          actorId: `guest_${suffix}_1`,
          actorType: "guest",
          entityId,
          entityType: "sample_project",
          properties: { source: index % 2 === 0 ? "message" : "link" },
        }),
      )
    }

    if (index <= 31) {
      events.push(
        event({
          externalId: `content_${suffix}`,
          eventName: "first_content_uploaded",
          occurredAt: iso(day, 5),
          actorId: `guest_${suffix}_1`,
          actorType: "guest",
          entityId,
          entityType: "sample_asset",
          properties: { source: index % 2 === 0 ? "message" : "link" },
        }),
      )
    }

    if (index <= 21) {
      events.push(
        event({
          externalId: `activation_${suffix}`,
          eventName: index % 2 === 0 ? "five_assets_uploaded" : "three_contributors_reached",
          occurredAt: iso(day, 8),
          actorId: "system",
          actorType: "system",
          entityId,
          entityType: "sample_project",
          properties: { threshold: index % 2 === 0 ? "five_assets" : "three_contributors" },
        }),
      )
    }

    if (index <= 12) {
      events.push(
        event({
          externalId: `checkout_${suffix}`,
          eventName: "checkout_started",
          occurredAt: iso(day, 12),
          actorId: organizerId,
          actorType: "organizer",
          entityId,
          entityType: "sample_project",
          properties: { amount: 9 },
        }),
      )
    }

    if (index <= 9) {
      events.push(
        event({
          externalId: `purchase_${suffix}`,
          eventName: "purchase_completed",
          occurredAt: iso(day, 13),
          actorId: organizerId,
          actorType: "organizer",
          entityId,
          entityType: "sample_project",
          properties: { amount: 9, currency: "EUR" },
        }),
      )
    }
  }

  return events
}
