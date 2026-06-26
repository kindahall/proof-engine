import { afterEach, describe, expect, it, vi } from "vitest"

const user = {
  id: "usr_test",
  email: "test@example.com",
  user_metadata: {},
}

const settings = {
  context: {
    workspaceSlug: "proof-workspace",
    workspaceId: "wrk_test",
    projectId: "prj_test",
  },
  workspace: {
    name: "Proof Workspace",
    slug: "proof-workspace",
    plan: "free",
  },
  project: {
    name: "Proof Project",
    websiteUrl: "https://example.com",
    description: "Projet test",
    productType: "SaaS",
    businessModel: "Abonnement",
    stage: "MVP",
    targetSegment: "PME",
    primaryUser: "Founder",
    problem: "Prioriser",
    buyingTrigger: "Croissance",
    currentAlternative: "Sheets",
    valueProposition: "Preuves",
    pricing: "49 EUR",
    activationDefinition: "Source synchronisée",
  },
  members: [{ name: "Camille", role: "owner" }],
}

async function loadExportRoute(options: {
  authOk?: boolean
  configured?: boolean
} = {}) {
  vi.resetModules()

  const persistence = {
    loadSettingsForUser: vi.fn(async () => settings),
    listPersistedConnectorsForUser: vi.fn(async () => [
      {
        id: "ds_test",
        provider: "postgres",
        name: "Postgres",
        status: "connected",
        syncMode: "scheduled",
        config: { eventsTable: "events" },
      },
    ]),
    listPersistedGatewayProfilesForUser: vi.fn(async () => []),
    listPersistedEventMappingsForUser: vi.fn(async () => []),
    listPersistedEvidenceForUser: vi.fn(async () => []),
    loadPersistedRuntimeState: vi.fn(async () => ({
      rawEvents: [],
      syncRuns: [],
      metricSnapshots: [],
    })),
    listPersistedDiagnosticsForUser: vi.fn(async () => []),
    listPersistedExperimentsForUser: vi.fn(async () => []),
    listPersistedLearningsForUser: vi.fn(async () => []),
  }

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
  vi.doMock("@/lib/persistence/supabase", () => persistence)

  return {
    ...(await import("@/app/api/settings/export/route")),
    persistence,
  }
}

describe("settings export API", () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock("@/lib/auth/api")
    vi.doUnmock("@/lib/supabase/env")
    vi.doUnmock("@/lib/persistence/supabase")
  })

  it("requires an authenticated user", async () => {
    const { GET } = await loadExportRoute({ authOk: false })

    const response = await GET()

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ ok: false, error: "unauthorized" })
  })

  it("requires server-side Supabase persistence", async () => {
    const { GET, persistence } = await loadExportRoute({ configured: false })

    const response = await GET()

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ ok: false, error: "supabase_not_configured" })
    expect(persistence.loadSettingsForUser).not.toHaveBeenCalled()
  })

  it("exports the authenticated workspace snapshot without connector secrets", async () => {
    const { GET, persistence } = await loadExportRoute()

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get("content-disposition")).toContain("proof-engine-proof-workspace")
    expect(payload).toMatchObject({
      ok: true,
      user: { id: user.id, email: user.email },
      workspace: settings.workspace,
      project: settings.project,
      members: settings.members,
      runtime: {
        rawEvents: [],
        syncRuns: [],
        metricSnapshots: [],
      },
    })
    expect(JSON.stringify(payload)).not.toMatch(/secret|token|connectionString|serviceAccountJson/i)
    expect(persistence.loadSettingsForUser).toHaveBeenCalledWith(user)
    expect(persistence.listPersistedDiagnosticsForUser).toHaveBeenCalledWith(user)
  })
})
