"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function ConnectorSyncButton({ dataSourceId }: { dataSourceId: string }) {
  const [loading, setLoading] = useState(false)

  async function sync() {
    setLoading(true)
    try {
      const response = await fetch(`/api/connectors/${dataSourceId}/sync`, { method: "POST" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.syncRun?.errorMessage ?? "Synchronisation impossible.")
      toast.success("Synchronisation terminee", {
        description: `${payload.syncRun.recordsInserted} nouveaux evenements, ${payload.syncRun.recordsDeduplicated} doublons ignores.`,
      })
    } catch (error) {
      toast.error("Synchronisation echouee", {
        description: error instanceof Error ? error.message : "Erreur inconnue.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={sync} disabled={loading}>
      <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Synchroniser maintenant
    </Button>
  )
}
