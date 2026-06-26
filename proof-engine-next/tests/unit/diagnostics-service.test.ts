import { afterEach, describe, expect, it, vi } from "vitest"

describe("diagnostics service", () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock("@/lib/ai/provider")
  })

  it("does not invoke the AI provider when the data quality gate is blocked", async () => {
    const generateDiagnostic = vi.fn()
    vi.doMock("@/lib/ai/provider", () => ({
      getAIProvider: () => ({ generateDiagnostic }),
    }))

    const { resetRuntimeState } = await import("@/lib/runtime/store")
    const { runDiagnosticFromRuntime } = await import("@/lib/diagnostics/service")
    resetRuntimeState()

    const result = await runDiagnosticFromRuntime()

    expect(result.gate.status).toBe("blocked")
    expect(result.diagnostic.status).toBe("insufficient")
    expect(result.diagnostic.missingEvidence.length).toBeGreaterThan(0)
    expect(generateDiagnostic).not.toHaveBeenCalled()
  })
})
