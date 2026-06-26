import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { sourceEventSchema, type SourceEvent } from "@/lib/connectors/schemas"

type ActorType = SourceEvent["actorType"]

export class FirebaseReadOnlyConnectorProvider {
  constructor(
    private readonly serviceAccountJson: string,
    private readonly collectionName = "events",
  ) {}

  private getFirestore() {
    const serviceAccount = JSON.parse(this.serviceAccountJson)
    const appName = `proof-engine-${serviceAccount.project_id ?? "firebase"}`
    const app = getApps().find((item) => item.name === appName) ?? initializeApp({ credential: cert(serviceAccount) }, appName)
    return getFirestore(app)
  }

  async testConnection() {
    const firestore = this.getFirestore()
    await firestore.listCollections()
    return {
      ok: true,
      status: "healthy" as const,
      latencyMs: 0,
      message: "Firestore accessible en lecture seule.",
    }
  }

  async readEvents(limit = 5000): Promise<SourceEvent[]> {
    const firestore = this.getFirestore()
    const snapshot = await firestore.collection(this.collectionName).limit(limit).get()
    return snapshot.docs.map((doc) => toSourceEvent(doc.id, doc.data()))
  }
}

function toSourceEvent(documentId: string, data: FirebaseFirestore.DocumentData): SourceEvent {
  return sourceEventSchema.parse({
    externalId: readString(data.externalId ?? data.external_id, documentId),
    eventName: readString(data.eventName ?? data.event_name ?? data.name ?? data.type, "firestore_event"),
    occurredAt: toIsoString(data.occurredAt ?? data.occurred_at ?? data.timestamp ?? data.createdAt ?? data.created_at),
    actorId: readString(data.actorId ?? data.actor_id ?? data.userId ?? data.user_id ?? data.customerId, "system"),
    actorType: normalizeActorType(data.actorType ?? data.actor_type),
    entityId: readString(data.entityId ?? data.entity_id ?? data.objectId ?? data.object_id, documentId),
    entityType: readString(data.entityType ?? data.entity_type ?? data.objectType ?? data.object_type, "firestore_document"),
    properties: readProperties(data),
  })
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback
}

function normalizeActorType(value: unknown): ActorType {
  return value === "organizer" || value === "guest" || value === "system" ? value : "system"
}

function toIsoString(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string" && value.trim()) return value
  if (typeof value === "number") return new Date(value > 1_000_000_000_000 ? value : value * 1000).toISOString()
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString()
  }
  return new Date().toISOString()
}

function readProperties(data: FirebaseFirestore.DocumentData): Record<string, unknown> {
  return data.properties && typeof data.properties === "object" && !Array.isArray(data.properties)
    ? data.properties
    : { ...data }
}
