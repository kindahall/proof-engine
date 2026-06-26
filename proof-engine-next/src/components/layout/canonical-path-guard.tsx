"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { canonicalizeAuthenticatedAppPath } from "@/lib/app/canonical-paths"

export function CanonicalPathGuard({
  workspaceSlug,
  projectId,
}: {
  workspaceSlug: string
  projectId: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const target = canonicalizeAuthenticatedAppPath({
      pathname,
      workspaceSlug,
      projectId,
      suffix: `${window.location.search}${window.location.hash}`,
    })
    if (target) router.replace(target)
  }, [pathname, projectId, router, workspaceSlug])

  return null
}
