import { describe, expect, it } from "vitest"
import { canonicalizeAuthenticatedAppPath } from "@/lib/app/canonical-paths"

const canonical = {
  workspaceSlug: "acme",
  projectId: "prj_acme",
}

describe("canonical authenticated app paths", () => {
  it("keeps canonical workspace and project paths unchanged", () => {
    expect(
      canonicalizeAuthenticatedAppPath({
        pathname: "/app/acme/projects/prj_acme/connectors",
        ...canonical,
      }),
    ).toBeNull()
  })

  it("canonicalizes the workspace slug while preserving the route suffix", () => {
    expect(
      canonicalizeAuthenticatedAppPath({
        pathname: "/app/old-slug/projects/prj_acme/gateway/new",
        ...canonical,
      }),
    ).toBe("/app/acme/projects/prj_acme/gateway/new")
  })

  it("canonicalizes the project id while preserving query and hash", () => {
    expect(
      canonicalizeAuthenticatedAppPath({
        pathname: "/app/acme/projects/prj_wrong/experiments/exp_123",
        suffix: "?tab=results#notes",
        ...canonical,
      }),
    ).toBe("/app/acme/projects/prj_acme/experiments/exp_123?tab=results#notes")
  })

  it("canonicalizes workspace-only pages", () => {
    expect(
      canonicalizeAuthenticatedAppPath({
        pathname: "/app/wrong/settings",
        ...canonical,
      }),
    ).toBe("/app/acme/settings")
  })

  it("does not touch non-workspace app routes", () => {
    expect(
      canonicalizeAuthenticatedAppPath({
        pathname: "/app/onboarding",
        ...canonical,
      }),
    ).toBeNull()
    expect(
      canonicalizeAuthenticatedAppPath({
        pathname: "/login",
        ...canonical,
      }),
    ).toBeNull()
  })
})
