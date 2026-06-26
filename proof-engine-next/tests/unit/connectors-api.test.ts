import { afterEach, describe, expect, it, vi } from "vitest"

const user = {
  id: "usr_test",
  email: "test@example.com",
  user_metadata: {},
}

async function loadConnectorsRoute(options: {
  authOk?: boolean
  configured?: boolean
} = {}) {
  vi.resetModules()
  const saveConnectorConnection = vi.fn(async () => ({
    context: {
      workspaceId: "wrk_test",
      workspaceSlug: "proof-workspace",
      projectId: "prj_test",
    },
    connector: {
      id: "ds_test",
      provider: "postgres",
      name: "Postgres",
      status: "not_connected",
    },
  }))

  vi.doMock("@/lib/auth/api", () => ({
    requireApiUser: vi.fn(async () =>
      options.authOk === false
        ? {
            ok: false,
            response: Response.json({ ok: false, error: "unauthorized" }, { status: 401 }),
          }
        : { ok: true, user },
    ),
  }))
  vi.doMock("@/lib/supabase/env", () => ({
    isSupabaseServerConfigured: () => options.configured !== false,
  }))
  vi.doMock("@/lib/persistence/supabase", () => ({
    saveConnectorConnection,
  }))

  return {
    ...(await import("@/app/api/connectors/route")),
    saveConnectorConnection,
  }
}

function postRequest(body: unknown) {
  return new Request("http://proof-engine.local/api/connectors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("connectors API", () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock("@/lib/auth/api")
    vi.doUnmock("@/lib/supabase/env")
    vi.doUnmock("@/lib/persistence/supabase")
  })

  it("rejects unauthenticated connector creation", async () => {
    const { POST } = await loadConnectorsRoute({ authOk: false })

    const response = await POST(postRequest({}))

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ ok: false, error: "unauthorized" })
  })

  it("requires server-side Supabase persistence", async () => {
    const { POST, saveConnectorConnection } = await loadConnectorsRoute({ configured: false })

    const response = await POST(postRequest({ provider: "postgres", name: "Postgres" }))

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ ok: false, error: "supabase_not_configured" })
    expect(saveConnectorConnection).not.toHaveBeenCalled()
  })

  it("rejects gateway providers on the connector endpoint", async () => {
    const { POST, saveConnectorConnection } = await loadConnectorsRoute()

    const response = await POST(postRequest({ provider: "http_gateway", name: "Gateway HTTP" }))

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ ok: false, error: "invalid_payload" })
    expect(saveConnectorConnection).not.toHaveBeenCalled()
  })

  it("persists a read-only connector for the authenticated user", async () => {
    const { POST, saveConnectorConnection } = await loadConnectorsRoute()

    const response = await POST(
      postRequest({
        provider: "postgres",
        name: "Postgres production",
        endpoint: "postgresql://readonly@example.test/app",
        secret: "server-only-secret",
        eventsTable: "events",
      }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      ok: true,
      dataSourceId: "ds_test",
      workspace: {
        slug: "proof-workspace",
        projectId: "prj_test",
      },
    })
    expect(saveConnectorConnection).toHaveBeenCalledWith({
      user,
      provider: "postgres",
      name: "Postgres production",
      endpoint: "postgresql://readonly@example.test/app",
      secret: "server-only-secret",
      eventsTable: "events",
    })
  })
})
