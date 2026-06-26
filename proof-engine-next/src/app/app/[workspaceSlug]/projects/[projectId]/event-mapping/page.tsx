import Link from "next/link"
import { CheckCircle2, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { listPersistedEventMappingsForUser } from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

export const metadata = { title: "Mapping d'événements" }

async function getMappings() {
  const user = await getAuthenticatedUser()
  if (!user || !isSupabaseServerConfigured()) return []
  return listPersistedEventMappingsForUser(user)
}

export default async function EventMappingPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  const mappings = await getMappings()
  const activeMappings = mappings.filter((mapping) => mapping.active).length

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Mapping d'événements"
        description="Convertissez vos événements sources en événements canoniques. Versionné et auditable."
        action={
          <Button asChild>
            <Link href={`/app/${workspaceSlug}/projects/${projectId}/connectors/new`}>
              <Database className="size-4" /> Connecter une source
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {mappings.length === 0 ? "Aucun mapping confirmé" : `${activeMappings} mapping(s) actif(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {mappings.length === 0 ? (
            <div className="space-y-3 text-muted-foreground">
              <p>
                Les événements du projet ne sont pas encore connus. Le mapping sera proposé après inspection d'une source connectée.
              </p>
              <p>Mappings actifs : 0</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Événement source</th>
                    <th className="px-3 py-2 font-medium">Canonique</th>
                    <th className="px-3 py-2 font-medium">Acteur</th>
                    <th className="px-3 py-2 font-medium">Étape</th>
                    <th className="px-3 py-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mappings.map((mapping) => (
                    <tr key={mapping.id}>
                      <td className="px-3 py-2 font-medium">{mapping.sourceEvent}</td>
                      <td className="px-3 py-2 text-muted-foreground">{mapping.canonicalEvent}</td>
                      <td className="px-3 py-2 text-muted-foreground">{mapping.actorType}</td>
                      <td className="px-3 py-2 text-muted-foreground">{mapping.funnelStage}</td>
                      <td className="px-3 py-2">
                        {mapping.active ? (
                          <ToneBadge tone="success">
                            <CheckCircle2 className="size-3" /> Actif
                          </ToneBadge>
                        ) : (
                          <ToneBadge tone="outline">Inactif</ToneBadge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
