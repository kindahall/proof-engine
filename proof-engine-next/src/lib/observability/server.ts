type LogLevel = "info" | "warn" | "error"

export interface ObservabilityContext {
  route?: string
  operation?: string
  userId?: string
  workspaceId?: string
  projectId?: string
  level?: LogLevel
  event?: string
  errorCode?: string
  metadata?: Record<string, unknown>
}

const sensitiveKeyPattern = /authorization|cookie|key|password|secret|signature|token/i

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[MaxDepth]"
  if (value == null) return value
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => sanitize(item, depth + 1))
  if (typeof value !== "object") return String(value)

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[REDACTED]" : sanitize(entry, depth + 1),
    ]),
  )
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.OBSERVABILITY_INCLUDE_STACK === "true" ? error.stack : undefined,
    }
  }

  if (typeof error === "object" && error != null) {
    const record = error as Record<string, unknown>
    return sanitize({
      name: record.name,
      message: record.message,
      code: record.code,
      status: record.status,
    })
  }

  return { message: String(error) }
}

export function captureEvent(context: ObservabilityContext) {
  if (process.env.OBSERVABILITY_DISABLED === "true") return

  const level = context.level ?? "info"
  const payload = sanitize({
    timestamp: new Date().toISOString(),
    level,
    event: context.event ?? "proof_engine.server_event",
    environment: process.env.NODE_ENV ?? "development",
    route: context.route,
    operation: context.operation,
    userId: context.userId,
    workspaceId: context.workspaceId,
    projectId: context.projectId,
    errorCode: context.errorCode,
    metadata: context.metadata,
  })
  const line = JSON.stringify(payload)

  if (level === "error") {
    console.error(line)
  } else if (level === "warn") {
    console.warn(line)
  } else {
    console.info(line)
  }
}

export function captureException(error: unknown, context: ObservabilityContext = {}) {
  captureEvent({
    ...context,
    level: context.level ?? "error",
    event: context.event ?? "proof_engine.server_exception",
    metadata: {
      ...context.metadata,
      error: serializeError(error),
    },
  })
}
