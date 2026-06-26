"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileSearch,
  Compass,
  FlaskConical,
  Lightbulb,
  Settings,
  Plug,
  Network,
  GitBranch,
  ShieldCheck,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/shared/logo"

function buildWorkspaceRoutes(workspaceSlug: string, projectId: string) {
  const projectBase = `/app/${workspaceSlug}/projects/${projectId}`
  return {
    dashboard: `/app/${workspaceSlug}/dashboard`,
    evidence: `${projectBase}/evidence`,
    diagnostic: `${projectBase}/diagnostic`,
    experiments: `${projectBase}/experiments`,
    learnings: `${projectBase}/learnings`,
    connectors: `${projectBase}/connectors`,
    gateway: `${projectBase}/gateway`,
    eventMapping: `${projectBase}/event-mapping`,
    dataQuality: `${projectBase}/data-quality`,
    settings: `/app/${workspaceSlug}/settings`,
  }
}

export function AppSidebar({
  workspaceSlug,
  projectId,
  workspaceName,
  workspaceTeam,
}: {
  workspaceSlug: string
  projectId: string
  workspaceName: string
  workspaceTeam: string
}) {
  const pathname = usePathname()
  const routes = buildWorkspaceRoutes(workspaceSlug, projectId)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")
  const pilotage = [
    { label: "Tableau de bord", href: routes.dashboard, icon: LayoutDashboard },
    { label: "Preuves", href: routes.evidence, icon: FileSearch },
    { label: "Diagnostic", href: routes.diagnostic, icon: Compass },
    { label: "Expériences", href: routes.experiments, icon: FlaskConical },
    { label: "Apprentissages", href: routes.learnings, icon: Lightbulb },
  ]
  const donnees = [
    { label: "Connecteurs", href: routes.connectors, icon: Plug },
    { label: "Gateway", href: routes.gateway, icon: Network },
    { label: "Mapping d'événements", href: routes.eventMapping, icon: GitBranch },
    { label: "Qualité des données", href: routes.dataQuality, icon: ShieldCheck },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-3">
        <Link href={routes.dashboard}>
          <Logo size={26} />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pilotage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pilotage.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Données connectées</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {donnees.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive(routes.settings)}>
              <Link href={routes.settings}>
                <Settings />
                <span>Paramètres</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={routes.dashboard}>
                <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-[10px] font-semibold text-background">
                  MY
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{workspaceName}</span>
                  <span className="text-xs text-muted-foreground">{workspaceTeam}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
