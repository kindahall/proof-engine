import { afterEach, describe, expect, it, vi } from "vitest"

const user = {
  id: "usr_test",
  email: "test@example.com",
  user_metadata: {},
}

const validPayload = {
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
}

async function loadSettingsRoute(options: {
  authOk?: boolean
  configured?: boolean
  updateImpl?: () => Promise<unknown>
} = {}) {
  vi.resetModules()
  const WorkspaceSlugTakenError = class WorkspaceSlugTakenError extends Error {
    constructor(slug: string) {
      super(`Le slug "${slug}" est déjà utilisé.`)
      this.name = "WorkspaceSlugTakenError"
    }
  }
  const updateSettingsForUser = vi.fn(
    options.updateImpl ??
      (async () => ({
        context: {
          workspaceSlug: validPayload.workspace.slug,
        },
        workspace: validPayload.workspace,
        project: validPayload.project,
      })),
  )

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
    updateSettingsForUser,
    WorkspaceSlugTakenError,
  }))

  return {
    ...(await import("@/app/api/settings/route")),
    updateSettingsForUser,
    WorkspaceSlugTakenError,
  }
}

function patchRequest(body: unknown) {
  return new Request("http://proof-engine.local/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("settings API", () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock("@/lib/auth/api")
    vi.doUnmock("@/lib/supabase/env")
    vi.doUnmock("@/lib/persistence/supabase")
  })

  it("rejects invalid settings payloads", async () => {
    const { PATCH, updateSettingsForUser } = await loadSettingsRoute()

    const response = await PATCH(patchRequest({ workspace: { slug: "bad slug" }, project: {} }))

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ ok: false, error: "invalid_payload" })
    expect(updateSettingsForUser).not.toHaveBeenCalled()
  })

  it("saves workspace and project settings for the authenticated user", async () => {
    const { PATCH, updateSettingsForUser } = await loadSettingsRoute()

    const response = await PATCH(patchRequest(validPayload))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      ok: true,
      redirectTo: "/app/proof-workspace/settings",
    })
    expect(updateSettingsForUser).toHaveBeenCalledWith({
      user,
      workspace: validPayload.workspace,
      project: validPayload.project,
    })
  })

  it("returns a conflict when the workspace slug already exists", async () => {
    const { PATCH, WorkspaceSlugTakenError } = await loadSettingsRoute({
      updateImpl: async () => {
        throw new WorkspaceSlugTakenError(validPayload.workspace.slug)
      },
    })

    const response = await PATCH(patchRequest(validPayload))

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ ok: false, error: "workspace_slug_taken" })
  })
})
