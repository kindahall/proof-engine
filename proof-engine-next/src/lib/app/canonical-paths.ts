export interface CanonicalAppPathInput {
  pathname: string
  workspaceSlug: string
  projectId: string
  suffix?: string
}

export function canonicalizeAuthenticatedAppPath({
  pathname,
  workspaceSlug,
  projectId,
  suffix = "",
}: CanonicalAppPathInput) {
  const segments = pathname.split("/")
  if (segments[0] !== "" || segments[1] !== "app" || !segments[2] || segments[2] === "onboarding") {
    return null
  }

  let changed = false
  if (segments[2] !== workspaceSlug) {
    segments[2] = workspaceSlug
    changed = true
  }

  if (segments[3] === "projects" && segments[4] && segments[4] !== projectId) {
    segments[4] = projectId
    changed = true
  }

  if (!changed) return null
  return `${segments.join("/")}${suffix}`
}
