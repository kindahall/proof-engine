import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { inspectGatewaySchema, syncGatewayEvents, testGatewayConnection } from "@/lib/gateway/service"
import { buildInternalGatewayHealth, buildInternalGatewaySchema } from "@/lib/gateway/internal"
import { resetRuntimeState } from "@/lib/runtime/store"

describe("gateway providers", () => {
  beforeEach(() => resetRuntimeState())
  afterEach(() => vi.unstubAllEnvs())

  it("validates minimum capabilities for the mock gateway", async () => {
    const health = await testGatewayConnection("gw_mock")
    expect(health.ok).toBe(true)
    expect(health.capabilities).toContain("schema.inspect")
    expect(health.capabilities).toContain("events.read")
  })

  it("blocks the mock gateway profile in production", async () => {
    vi.stubEnv("NODE_ENV", "production")

    const health = await testGatewayConnection("gw_mock")

    expect(health.ok).toBe(false)
    expect(health.status).toBe("blocked")
  })

  it("blocks mock gateway input in production", async () => {
    vi.stubEnv("NODE_ENV", "production")

    const health = await testGatewayConnection("candidate", {
      provider: "mock_gateway",
      name: "Mock Gateway",
      transport: "http",
      endpoint: "mock://local",
    })

    expect(health.ok).toBe(false)
    expect(health.status).toBe("blocked")
  })

  it("does not synthesize data for prepared gateway providers", async () => {
    const health = await testGatewayConnection("candidate", {
      provider: "codex_mcp_gateway",
      name: "Codex MCP Gateway",
      transport: "mcp",
      endpoint: "mcp://localhost/proof-engine",
    })

    expect(health.ok).toBe(false)
    expect(health.status).toBe("blocked")
    expect(health.capabilities).toEqual([])
    expect(health.message).toContain("transport")
  })

  it("inspects schema and synchronizes events through gateway", async () => {
    const schema = await inspectGatewaySchema("gw_mock")
    const run = await syncGatewayEvents("gw_mock")

    expect(schema.objects.map((object) => object.name)).toContain("events")
    expect(run.status).toBe("success")
    expect(run.recordsInserted).toBeGreaterThan(0)
  })

  it("exposes the internal MCP gateway without the mock provider", () => {
    const health = buildInternalGatewayHealth()
    const schema = buildInternalGatewaySchema({ events: [], metrics: [] })

    expect(health.ok).toBe(true)
    expect(health.capabilities).toContain("schema.inspect")
    expect(health.message).not.toMatch(/mock/i)
    expect(schema.sourceId).toBe("proof_engine_internal")
    expect(schema.objects.map((object) => object.name)).toEqual(["events", "metrics"])
  })
})
