"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "./theme-toggle"
import { LanguageToggle } from "@/components/i18n/language-toggle"
import { routes } from "@/lib/routes"

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  connectors: "Connecteurs",
  gateway: "Gateway",
  "event-mapping": "Mapping d'événements",
  "data-quality": "Qualité des données",
  evidence: "Preuves",
  diagnostic: "Diagnostic",
  experiments: "Expériences",
  learnings: "Apprentissages",
  settings: "Paramètres",
  new: "Nouveau",
}

export function AppTopbar({
  dashboardHref,
  projectName,
}: {
  dashboardHref: string
  projectName: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const segments = pathname.split("/").filter(Boolean)
  // Drop "app", workspace slug, "projects", projectId from the visible crumb trail
  const visible = segments.filter(
    (s, i) => !(i === 0 && s === "app") && s !== "projects" && segments[i - 1] !== "projects" && i > 1,
  )

  const crumbs = visible.map((seg) => SEGMENT_LABELS[seg] ?? prettify(seg))

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" })
    const result = (await response.json().catch(() => ({}))) as { redirectTo?: string }
    router.push(result.redirectTo ?? routes.login)
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={dashboardHref}>{projectName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{c}</BreadcrumbPage>
                ) : (
                  <span className="text-muted-foreground">{c}</span>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
        <Button variant="ghost" size="icon" type="button" onClick={logout} aria-label="Se déconnecter">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}

function prettify(seg: string) {
  if (seg.length > 16) return seg.slice(0, 8) + "…"
  return seg.charAt(0).toUpperCase() + seg.slice(1)
}
