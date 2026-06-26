import { createHash } from "node:crypto"
import type { User } from "@supabase/supabase-js"
import { aiConfig } from "@/config/ai"
import {
  ensureWorkspaceForUser,
  recordAIRun,
  recordUsageEvent,
  releaseAIUsage,
  reserveAIUsage,
} from "@/lib/persistence/supabase"
import { captureException } from "@/lib/observability/server"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

const aiUsageEventType = "ai_generation"

export class AIRateLimitError extends Error {
  constructor(public readonly limit: number, public readonly used?: number) {
    super(`Limite IA quotidienne atteinte (${limit}).`)
    this.name = "AIRateLimitError"
  }
}

function inputFingerprint(input: unknown) {
  if (input === undefined) return { inputHash: null, inputSize: null }
  const serialized = JSON.stringify(input)
  return {
    inputHash: createHash("sha256").update(serialized).digest("hex"),
    inputSize: Buffer.byteLength(serialized, "utf8"),
  }
}

export async function withAIRateLimit<T>(
  user: User | undefined,
  run: () => Promise<T>,
  metadata: { feature: string; promptVersion: string; input?: unknown } = {
    feature: aiUsageEventType,
    promptVersion: "unknown",
  },
): Promise<T> {
  if (aiConfig.provider !== "openai" || !user || !isSupabaseServerConfigured()) {
    return run()
  }

  const context = await ensureWorkspaceForUser(user)
  const reservation = await reserveAIUsage({
    context,
    userId: user.id,
    eventType: aiUsageEventType,
    limit: aiConfig.dailyLimit,
  })

  if (!reservation.allowed) {
    throw new AIRateLimitError(reservation.limit, reservation.used)
  }

  const started = Date.now()
  const fingerprint = inputFingerprint(metadata.input)
  let result: T

  try {
    result = await run()
  } catch (error) {
    await releaseAIUsage({
      context,
      userId: user.id,
      eventType: aiUsageEventType,
    }).catch((releaseError: unknown) => {
      captureException(releaseError, {
        level: "error",
        event: "proof_engine.ai_usage_release_failed",
        operation: "release_ai_usage",
        userId: user.id,
        workspaceId: context.workspaceId,
        projectId: context.projectId,
      })
    })
    await recordAIRun({
      context,
      feature: metadata.feature,
      provider: aiConfig.provider,
      model: aiConfig.model,
      promptVersion: metadata.promptVersion,
      inputHash: fingerprint.inputHash,
      inputSize: fingerprint.inputSize,
      latencyMs: Date.now() - started,
      success: false,
      errorCode: error instanceof Error ? error.name : "unknown_error",
    }).catch((recordError: unknown) => {
      captureException(recordError, {
        level: "error",
        event: "proof_engine.ai_run_record_failed",
        operation: "record_ai_run",
        userId: user.id,
        workspaceId: context.workspaceId,
        projectId: context.projectId,
      })
    })
    throw error
  }

  await recordUsageEvent({
    context,
    userId: user.id,
    eventType: aiUsageEventType,
  })
  await recordAIRun({
    context,
    feature: metadata.feature,
    provider: aiConfig.provider,
    model: aiConfig.model,
    promptVersion: metadata.promptVersion,
    inputHash: fingerprint.inputHash,
    inputSize: fingerprint.inputSize,
    latencyMs: Date.now() - started,
    success: true,
  })

  return result
}
