"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useState, type FormEvent } from "react"
import { Download } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { useLanguage } from "@/components/i18n/language-provider"
import type { Language } from "@/lib/i18n/dom-translations"

type WorkspaceSettingsViewModel = {
  name: string
  slug: string
  plan: string
}

type ProjectSettingsViewModel = {
  name: string
  websiteUrl: string
  description: string
  productType: string
  businessModel: string
  stage: string
  targetSegment: string
  primaryUser: string
  problem: string
  buyingTrigger: string
  currentAlternative: string
  valueProposition: string
  pricing: string
  activationDefinition: string
}

type MemberSettingsViewModel = {
  name: string
  role: string
}

function FieldText({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input name={name} defaultValue={defaultValue} />
    </div>
  )
}

function formText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

function settingsPayload(form: HTMLFormElement) {
  const formData = new FormData(form)
  return {
    workspace: {
      name: formText(formData, "workspace.name"),
      slug: formText(formData, "workspace.slug"),
      plan: formText(formData, "workspace.plan"),
    },
    project: {
      name: formText(formData, "project.name"),
      websiteUrl: formText(formData, "project.websiteUrl"),
      description: formText(formData, "project.description"),
      productType: formText(formData, "project.productType"),
      businessModel: formText(formData, "project.businessModel"),
      stage: formText(formData, "project.stage"),
      targetSegment: formText(formData, "project.targetSegment"),
      primaryUser: formText(formData, "project.primaryUser"),
      problem: formText(formData, "project.problem"),
      buyingTrigger: formText(formData, "project.buyingTrigger"),
      currentAlternative: formText(formData, "project.currentAlternative"),
      valueProposition: formText(formData, "project.valueProposition"),
      pricing: formText(formData, "project.pricing"),
      activationDefinition: formText(formData, "project.activationDefinition"),
    },
  }
}

export function SettingsView({
  workspace,
  project,
  members,
  dataLinks,
}: {
  workspace: WorkspaceSettingsViewModel
  project: ProjectSettingsViewModel
  members: MemberSettingsViewModel[]
  dataLinks: {
    connectors: string
    gateway: string
    dataQuality: string
  }
}) {
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsPayload(event.currentTarget)),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        message?: string
        redirectTo?: string
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Impossible d'enregistrer les paramètres.")
      }

      toast.success("Modifications enregistrées")
      if (payload.redirectTo && payload.redirectTo !== window.location.pathname) {
        router.replace(payload.redirectTo)
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer les paramètres.")
    } finally {
      setSaving(false)
    }
  }

  async function exportData() {
    setExporting(true)
    try {
      const response = await fetch("/api/settings/export", {
        method: "GET",
        headers: { Accept: "application/json" },
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(payload.message ?? "Export impossible.")
      }

      const blob = await response.blob()
      const disposition = response.headers.get("content-disposition")
      const filename = disposition?.match(/filename="([^"]+)"/)?.[1] ?? `proof-engine-${workspace.slug}.json`
      const href = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = href
      anchor.download = filename
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(href)
      toast.success("Export préparé")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export impossible.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <form onSubmit={saveSettings} className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez votre espace de travail et son projet."
      />
      <input type="hidden" name="workspace.plan" value={workspace.plan} />

      <Tabs
        orientation="vertical"
        defaultValue="workspace"
        className="items-start gap-6 sm:gap-8"
      >
        <TabsList
          variant="line"
          className="sticky top-20 w-full gap-0.5 sm:w-52 sm:shrink-0"
        >
          <TabsTrigger value="workspace">Espace de travail</TabsTrigger>
          <TabsTrigger value="project">Projet</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
          <TabsTrigger value="data">Données &amp; confidentialité</TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1">
        {/* Workspace */}
        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identité de l'espace</CardTitle>
              <CardDescription>
                Personnalisez le nom et l'identifiant de votre espace de travail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldText label="Nom de l'espace" name="workspace.name" defaultValue={workspace.name} />
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input name="workspace.slug" defaultValue={workspace.slug} />
                <p className="text-xs text-muted-foreground">
                  L'identifiant de l'espace apparaît dans les URL.
                </p>
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan actuel</CardTitle>
              <CardDescription>
                Votre niveau d'accès pour cet espace.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm">{planLabel(workspace.plan)}</span>
              <ToneBadge tone="outline">{workspace.plan}</ToneBadge>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project */}
        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identité du projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldText label="Nom du projet" name="project.name" defaultValue={project.name} />
              <FieldText label="Site web" name="project.websiteUrl" defaultValue={project.websiteUrl} />
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea name="project.description" defaultValue={project.description} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contexte produit</CardTitle>
              <CardDescription>
                Ces éléments guident le diagnostic fondé sur preuves. Renseignez-les au mieux.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldText label="Type de produit" name="project.productType" defaultValue={project.productType} />
                <FieldText label="Modèle économique" name="project.businessModel" defaultValue={project.businessModel} />
                <FieldText label="Stade" name="project.stage" defaultValue={project.stage} />
                <FieldText label="Segment cible" name="project.targetSegment" defaultValue={project.targetSegment} />
                <FieldText label="Utilisateur principal" name="project.primaryUser" defaultValue={project.primaryUser} />
                <FieldText label="Tarification" name="project.pricing" defaultValue={project.pricing} />
              </div>
              <div className="space-y-1.5">
                <Label>Problème</Label>
                <Textarea name="project.problem" defaultValue={project.problem} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Déclencheur d'achat</Label>
                <Textarea name="project.buyingTrigger" defaultValue={project.buyingTrigger} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Alternative actuelle</Label>
                <Textarea name="project.currentAlternative" defaultValue={project.currentAlternative} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Proposition de valeur</Label>
                <Textarea name="project.valueProposition" defaultValue={project.valueProposition} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activation</CardTitle>
              <CardDescription>
                La métrique d'activation est dérivée des événements réels une fois la source synchronisée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Définition de l'activation</Label>
                <Textarea name="project.activationDefinition" defaultValue={project.activationDefinition} rows={2} />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Membres de l'équipe</CardTitle>
                <CardDescription>
                  Personnes ayant accès à cet espace.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {members.map((m) => (
                  <li
                    key={m.name}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {initialsFor(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{m.name}</span>
                    </div>
                    <ToneBadge tone="outline">{roleLabel(m.role)}</ToneBadge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Préférences d'affichage</CardTitle>
              <CardDescription>
                La langue et le thème s'appliquent immédiatement à toute l'application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Langue</Label>
                <Select
                  value={language}
                  onValueChange={(v) => {
                    setLanguage(v as Language)
                    toast.success("Préférence mise à jour")
                  }}
                >
                  <SelectTrigger className="w-full sm:w-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choisissez la langue de l'interface.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Thème</Label>
                <Select
                  value={theme ?? "system"}
                  onValueChange={(v) => {
                    setTheme(v)
                    toast.success("Préférence mise à jour")
                  }}
                >
                  <SelectTrigger className="w-full sm:w-60">
                    <SelectValue placeholder="Système" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground">
                Ces préférences sont enregistrées sur cet appareil.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & privacy */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sources connectées</CardTitle>
              <CardDescription>
                Accédez aux pages dédiées pour gérer vos données.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={dataLinks.connectors}>Connecteurs</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={dataLinks.gateway}>Gateway</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={dataLinks.dataQuality}>Qualité des données</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conservation des données</CardTitle>
              <CardDescription>
                Les données synchronisées sont conservées tant que la source reste connectée.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Téléchargez une copie des données de ce projet.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportData}
                disabled={exporting}
              >
                <Download className="size-4" />
                {exporting ? "Préparation..." : "Exporter mes données"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>
    </form>
  )
}

function initialsFor(name: string) {
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .padEnd(2, "U")
}

function roleLabel(role: string) {
  if (role === "owner") return "Propriétaire"
  if (role === "editor") return "Éditeur"
  if (role === "viewer") return "Lecteur"
  return role
}

function planLabel(plan: string) {
  if (plan === "free") return "Gratuit"
  if (plan === "local") return "Local"
  return plan
}
