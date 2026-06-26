import { describe, expect, it } from "vitest"
import {
  buildLoginRedirectPath,
  buildPostAuthRedirectPath,
  normalizeNextPath,
} from "@/lib/auth/redirects"

describe("auth redirects", () => {
  it("keeps only same-origin relative next paths", () => {
    expect(normalizeNextPath("/app/myteuf/dashboard?tab=data")).toBe("/app/myteuf/dashboard?tab=data")
    expect(normalizeNextPath("https://evil.example/app")).toBeNull()
    expect(normalizeNextPath("//evil.example/app")).toBeNull()
    expect(normalizeNextPath("/login")).toBeNull()
  })

  it("builds safe login and post-auth redirects", () => {
    expect(buildLoginRedirectPath("/app/myteuf/dashboard")).toBe("/login?next=%2Fapp%2Fmyteuf%2Fdashboard")
    expect(buildPostAuthRedirectPath("/app/myteuf/projects/prj_myteuf/evidence")).toBe(
      "/app/myteuf/projects/prj_myteuf/evidence",
    )
    expect(buildPostAuthRedirectPath("https://evil.example")).toBe("/app/myteuf/dashboard")
  })
})
