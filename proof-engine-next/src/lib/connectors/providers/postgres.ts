import pg from "pg"
import { sourceEventSchema, type SourceEvent } from "@/lib/connectors/schemas"

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function quoteTableName(tableName: string) {
  return tableName
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(quoteIdentifier)
    .join(".")
}

function rowValue(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] != null) return row[key]
  }
  return undefined
}

export class PostgresReadOnlyConnectorProvider {
  constructor(
    private readonly connectionString: string,
    private readonly eventsTable = "events",
  ) {}

  private createClient() {
    return new pg.Client({
      connectionString: this.connectionString,
      statement_timeout: 5000,
      options: "-c default_transaction_read_only=on",
    })
  }

  async testConnection() {
    const startedAt = Date.now()
    const client = this.createClient()
    await client.connect()
    try {
      const result = await client.query("select current_database() as database_name")
      return {
        ok: true,
        status: "healthy" as const,
        latencyMs: Date.now() - startedAt,
        message: `PostgreSQL read-only accessible: ${result.rows[0]?.database_name ?? "database"}.`,
      }
    } finally {
      await client.end()
    }
  }

  async readEvents(limit = 5000): Promise<SourceEvent[]> {
    const client = this.createClient()
    await client.connect()
    try {
      await client.query("begin read only")
      const table = quoteTableName(this.eventsTable)
      const result = await client.query(`select * from ${table} limit $1`, [limit])
      await client.query("commit")

      return result.rows.map((row: Record<string, unknown>, index) => {
        const externalId = rowValue(row, "externalId", "external_id", "id")
        const eventName = rowValue(row, "eventName", "event_name", "name")
        const occurredAt = rowValue(row, "occurredAt", "occurred_at", "timestamp", "created_at")
        const actorId = rowValue(row, "actorId", "actor_id", "user_id", "anonymous_id")
        const actorType = rowValue(row, "actorType", "actor_type")
        const entityId = rowValue(row, "entityId", "entity_id", "project_id", "object_id")
        const entityType = rowValue(row, "entityType", "entity_type", "object_type")
        const properties = rowValue(row, "properties", "payload", "metadata")

        return sourceEventSchema.parse({
          externalId: String(externalId ?? `pg_${index}_${JSON.stringify(row)}`),
          eventName: String(eventName),
          occurredAt: occurredAt instanceof Date ? occurredAt.toISOString() : String(occurredAt),
          actorId: String(actorId ?? "unknown_actor"),
          actorType: actorType === "guest" || actorType === "system" ? actorType : "organizer",
          entityId: String(entityId ?? externalId ?? `entity_${index}`),
          entityType: String(entityType ?? "entity"),
          properties: typeof properties === "object" && properties != null ? properties : row,
        })
      })
    } catch (error) {
      await client.query("rollback").catch(() => undefined)
      throw error
    } finally {
      await client.end()
    }
  }
}
