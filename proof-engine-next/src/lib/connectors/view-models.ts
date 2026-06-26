import type { User } from "@supabase/supabase-js"
import { connectorCatalog } from "@/lib/connectors/catalog"
import type { Connector } from "@/lib/mock/types"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import { listPersistedConnectorsForUser, type PersistedConnector } from "@/lib/persistence/supabase"

const catalogProviders = new Set(connectorCatalog.map((item) => item.provider))

function isCatalogConnector(
  connector: PersistedConnector,
): connector is PersistedConnector & { provider: Connector["provider"] } {
  return catalogProviders.has(connector.provider as Connector["provider"])
}

type CatalogPersistedConnector = PersistedConnector & { provider: Connector["provider"] }

function permissionsFor(connector: CatalogPersistedConnector) {
  return connectorCatalog.find((item) => item.provider === connector.provider)?.permissions ?? [
    "Lecture seule de la source connectée",
    "Secret stocké chiffré côté serveur",
    "Aucune écriture vers l'application analysée",
  ]
}

function toConnectorCard(connector: CatalogPersistedConnector): Connector {
  return {
    id: connector.id,
    provider: connector.provider,
    name: connector.name,
    status: connector.status,
    syncMode: connector.syncMode,
    lastSyncAt: connector.lastSuccessfulSyncAt,
    nextSyncAt: null,
    lastError: connector.lastError,
    recordsSynced: connector.recordsSynced,
    permissions: permissionsFor(connector),
  }
}

export async function getConnectorCards(user: User | null): Promise<Connector[]> {
  if (!user || !isSupabaseServerConfigured()) return connectorCatalog

  const persisted = await listPersistedConnectorsForUser(user)
  const cardsByProvider = new Map(
    persisted
      .filter(isCatalogConnector)
      .map((connector) => [connector.provider, toConnectorCard(connector)]),
  )

  return connectorCatalog.map((catalogItem) => cardsByProvider.get(catalogItem.provider) ?? catalogItem)
}

export async function getConnectorCard(user: User | null, dataSourceId: string) {
  const cards = await getConnectorCards(user)
  return cards.find((connector) => connector.id === dataSourceId)
}
