import type { User } from "@supabase/supabase-js"
import { afterEach, describe, expect, it, vi } from "vitest"

const context = {
  userId: "usr_test",
  workspaceId: "wsp_test",
  workspaceSlug: "test",
  projectId: "prj_test",
}

const user = {
  id: "usr_test",
  email: "test@example.com",
  user_metadata: {},
} as User

type PersistenceMocks = {
  ensureWorkspaceForUser: ReturnType<typeof vi.fn>
  reserveAIUsage: ReturnType<typeof vi.fn>
  releaseAIUsage: ReturnType<typeof vi.fn>
  recordUsageEvent: ReturnType<typeof vi.fn>
  recordAIRun: ReturnType<typeof vi.fn>
}

async function loadRateLimitModule(
  reservation: { allowed: boolean; used: number; limit: number },
  overrides: Partial<PersistenceMocks> = {},
) {
  vi.resetModules()
  vi.stubEnv("AI_PROVIDER", "openai")
  vi.stubEnv("AI_DAILY_LIMIT", "1")

  const persistence = {
    ensureWorkspaceForUser: vi.fn(async () => context),
    reserveAIUsage: vi.fn(async () => reservation),
    releaseAIUsage: vi.fn(async () => undefined),
    recordUsageEvent: vi.fn(async () => undefined),
    recordAIRun: vi.fn(async () => undefined),
    ...overrides,
  }
  const observability = {
    captureException: vi.fn(),
  }

  vi.doMock("@/lib/supabase/env", () => ({
    isSupabaseServerConfigured: () => true,
  }))
  vi.doMock("@/lib/persistence/supabase", () => persistence)
  vi.doMock("@/lib/observability/server", () => observability)

  return {
    ...(await import("@/lib/ai/rate-limit")),
    persistence,
    observability,
  }
}

describe("AI rate limit", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.doUnmock("@/lib/supabase/env")
    vi.doUnmock("@/lib/persistence/supabase")
    vi.doUnmock("@/lib/observability/server")
  })

  it("blocks OpenAI calls when the daily limit is reached", async () => {
    const { withAIRateLimit, AIRateLimitError, persistence } = await loadRateLimitModule({
      allowed: false,
      used: 1,
      limit: 1,
    })
    const run = vi.fn(async () => "ok")

    await expect(withAIRateLimit(user, run)).rejects.toBeInstanceOf(AIRateLimitError)

    expect(run).not.toHaveBeenCalled()
    expect(persistence.reserveAIUsage).toHaveBeenCalledWith({
      context,
      userId: user.id,
      eventType: "ai_generation",
      limit: 1,
    })
    expect(persistence.releaseAIUsage).not.toHaveBeenCalled()
    expect(persistence.recordUsageEvent).not.toHaveBeenCalled()
    expect(persistence.recordAIRun).not.toHaveBeenCalled()
  })

  it("records successful OpenAI usage and run metadata", async () => {
    const { withAIRateLimit, persistence } = await loadRateLimitModule({
      allowed: true,
      used: 1,
      limit: 1,
    })
    const run = vi.fn(async () => "ok")

    await expect(
      withAIRateLimit(user, run, {
        feature: "diagnostic",
        promptVersion: "diagnostic@test",
        input: { evidenceIds: ["ev_1"] },
      }),
    ).resolves.toBe("ok")

    expect(persistence.recordUsageEvent).toHaveBeenCalledWith({
      context,
      userId: user.id,
      eventType: "ai_generation",
    })
    expect(persistence.recordAIRun).toHaveBeenCalledWith(
      expect.objectContaining({
        context,
        feature: "diagnostic",
        provider: "openai",
        model: expect.any(String),
        promptVersion: "diagnostic@test",
        success: true,
      }),
    )
    expect(persistence.releaseAIUsage).not.toHaveBeenCalled()
  })

  it("releases the reserved AI usage when the provider call fails", async () => {
    const { withAIRateLimit, persistence } = await loadRateLimitModule({
      allowed: true,
      used: 1,
      limit: 1,
    })
    const error = new Error("provider failed")
    const run = vi.fn(async () => {
      throw error
    })

    await expect(withAIRateLimit(user, run)).rejects.toThrow("provider failed")

    expect(persistence.releaseAIUsage).toHaveBeenCalledWith({
      context,
      userId: user.id,
      eventType: "ai_generation",
    })
    expect(persistence.recordUsageEvent).not.toHaveBeenCalled()
    expect(persistence.recordAIRun).toHaveBeenCalledWith(
      expect.objectContaining({
        context,
        feature: "ai_generation",
        success: false,
        errorCode: "Error",
      }),
    )
  })

  it("keeps the reserved AI usage when audit persistence fails after a successful provider call", async () => {
    const auditError = new Error("audit failed")
    const { withAIRateLimit, persistence } = await loadRateLimitModule(
      {
        allowed: true,
        used: 1,
        limit: 1,
      },
      {
        recordUsageEvent: vi.fn(async () => {
          throw auditError
        }),
      },
    )
    const run = vi.fn(async () => "ok")

    await expect(withAIRateLimit(user, run)).rejects.toThrow("audit failed")

    expect(run).toHaveBeenCalledOnce()
    expect(persistence.releaseAIUsage).not.toHaveBeenCalled()
    expect(persistence.recordAIRun).not.toHaveBeenCalled()
  })

  it("preserves the provider error when failed-run audit persistence also fails", async () => {
    const providerError = new Error("provider failed")
    const auditError = new Error("audit failed")
    const { withAIRateLimit, persistence, observability } = await loadRateLimitModule(
      {
        allowed: true,
        used: 1,
        limit: 1,
      },
      {
        recordAIRun: vi.fn(async () => {
          throw auditError
        }),
      },
    )
    const run = vi.fn(async () => {
      throw providerError
    })

    await expect(withAIRateLimit(user, run)).rejects.toBe(providerError)

    expect(persistence.releaseAIUsage).toHaveBeenCalledWith({
      context,
      userId: user.id,
      eventType: "ai_generation",
    })
    expect(observability.captureException).toHaveBeenCalledWith(
      auditError,
      expect.objectContaining({
        event: "proof_engine.ai_run_record_failed",
        operation: "record_ai_run",
      }),
    )
  })
})
