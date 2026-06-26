import { ConnectorWizard } from "@/features/connectors/connector-wizard"

export const metadata = { title: "Nouvelle source" }

export default async function NewConnectorPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params
  return <ConnectorWizard connectorsHref={`/app/${workspaceSlug}/projects/${projectId}/connectors`} />
}
