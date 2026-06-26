import { afterEach, describe, expect, it, vi } from "vitest"
import { handleApiError } from "@/lib/api/errors"
import { captureException } from "@/lib/observability/server"

describe("server observability", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it("writes structured logs and redacts sensitive metadata", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)

    captureException(new Error("boom"), {
      route: "/api/test",
      operation: "POST",
      metadata: {
        safe: "visible",
        apiToken: "sk_test_secret",
        nested: {
          password: "secret-password",
          signature: "sha256=test",
        },
      },
    })

    const payload = JSON.parse(String(errorSpy.mock.calls[0][0])) as Record<string, unknown>
    const metadata = payload.metadata as Record<string, unknown>
    const nested = metadata.nested as Record<string, unknown>

    expect(payload).toMatchObject({ level: "error", route: "/api/test", operation: "POST" })
    expect(metadata.safe).toBe("visible")
    expect(metadata.apiToken).toBe("[REDACTED]")
    expect(nested.password).toBe("[REDACTED]")
    expect(nested.signature).toBe("[REDACTED]")
  })

  it("logs Supabase operational errors before returning their API response", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)

    const response = handleApiError(
      { code: "PGRST205", message: "Could not find the table in the schema cache" },
      { route: "/api/connectors", operation: "POST" },
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: "supabase_schema_not_ready" })

    const payload = JSON.parse(String(warnSpy.mock.calls[0][0])) as Record<string, unknown>
    expect(payload).toMatchObject({
      level: "warn",
      event: "proof_engine.api_supabase_operational_error",
      route: "/api/connectors",
      errorCode: "supabase_schema_not_ready",
    })
  })
})
