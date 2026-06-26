export const defaultAuthenticatedPath = "/app/myteuf/dashboard"
export const onboardingPath = "/app/onboarding"

export function workspaceDashboardPath(workspaceSlug: string) {
  return `/app/${workspaceSlug}/dashboard`
}

const blockedPostAuthPaths = new Set(["/login", "/signup"])

export function normalizeNextPath(value: string | null | undefined) {
  if (!value) return null
  if (!value.startsWith("/") || value.startsWith("//")) return null

  try {
    const url = new URL(value, "http://proof-engine.local")
    if (url.origin !== "http://proof-engine.local") return null
    if (blockedPostAuthPaths.has(url.pathname)) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function buildLoginRedirectPath(nextPath?: string | null) {
  const safeNextPath = normalizeNextPath(nextPath)
  return safeNextPath ? `/login?next=${encodeURIComponent(safeNextPath)}` : "/login"
}

export function buildPostAuthRedirectPath(nextPath?: string | null) {
  return normalizeNextPath(nextPath) ?? defaultAuthenticatedPath
}
