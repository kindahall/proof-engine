import type { CanonicalEventName, EventMapping, SourceEvent } from "@/lib/connectors/schemas"

export const sampleEventMappings: EventMapping[] = [
  { sourceEventName: "sample_project_created", canonicalEventName: "project_created", actorType: "organizer", entityType: "sample_project", funnelStage: "Creation", isActive: true, version: 1 },
  { sourceEventName: "event_created", canonicalEventName: "project_created", actorType: "organizer", entityType: "sample_project", funnelStage: "Creation", isActive: true, version: 1 },
  { sourceEventName: "share_surface_viewed", canonicalEventName: "core_action_started", actorType: "organizer", entityType: "sample_project", funnelStage: "Partage", isActive: true, version: 1 },
  { sourceEventName: "share_button_clicked", canonicalEventName: "invite_sent", actorType: "organizer", entityType: "sample_project", funnelStage: "Partage", isActive: true, version: 1 },
  { sourceEventName: "link_copied", canonicalEventName: "invite_sent", actorType: "organizer", entityType: "sample_project", funnelStage: "Partage", isActive: true, version: 1 },
  { sourceEventName: "message_share_clicked", canonicalEventName: "invite_sent", actorType: "organizer", entityType: "sample_project", funnelStage: "Partage", isActive: true, version: 1 },
  { sourceEventName: "guest_joined", canonicalEventName: "guest_joined", actorType: "guest", entityType: "sample_project", funnelStage: "Arrivee invites", isActive: true, version: 1 },
  { sourceEventName: "first_content_uploaded", canonicalEventName: "content_uploaded", actorType: "guest", entityType: "sample_asset", funnelStage: "Contribution", isActive: true, version: 1 },
  { sourceEventName: "five_assets_uploaded", canonicalEventName: "activation_reached", actorType: "system", entityType: "sample_project", funnelStage: "Activation", isActive: true, version: 1 },
  { sourceEventName: "three_contributors_reached", canonicalEventName: "activation_reached", actorType: "system", entityType: "sample_project", funnelStage: "Activation", isActive: true, version: 1 },
  { sourceEventName: "checkout_started", canonicalEventName: "checkout_started", actorType: "organizer", entityType: "sample_project", funnelStage: "Paiement", isActive: true, version: 1 },
  { sourceEventName: "purchase_completed", canonicalEventName: "purchase_completed", actorType: "organizer", entityType: "sample_project", funnelStage: "Paiement", isActive: true, version: 1 },
  { sourceEventName: "second_project_created", canonicalEventName: "second_project_created", actorType: "organizer", entityType: "sample_project", funnelStage: "Retention", isActive: true, version: 1 },
]

export function mapSourceEvent(
  eventName: string,
  mappings: EventMapping[] = sampleEventMappings,
): CanonicalEventName | null {
  return mappings.find((mapping) => mapping.isActive && mapping.sourceEventName === eventName)?.canonicalEventName ?? null
}

export function validateMappingCoverage(events: SourceEvent[], mappings: EventMapping[] = sampleEventMappings) {
  const sourceNames = new Set(events.map((event) => event.eventName))
  const mappedNames = new Set(mappings.filter((mapping) => mapping.isActive).map((mapping) => mapping.sourceEventName))
  const unmapped = [...sourceNames].filter((name) => !mappedNames.has(name)).sort()

  return {
    totalSourceEvents: sourceNames.size,
    mappedSourceEvents: sourceNames.size - unmapped.length,
    unmapped,
    score: sourceNames.size === 0 ? 0 : Math.round(((sourceNames.size - unmapped.length) / sourceNames.size) * 100),
  }
}
