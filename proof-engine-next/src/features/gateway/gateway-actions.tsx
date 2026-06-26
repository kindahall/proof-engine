"use client"

import { useState } from "react"
import { Database, RefreshCw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function GatewayActions({ gatewayConnectionId }: { gatewayConnectionId: string }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function call(action: "test" | "inspect-schema" | "sync") {
    setLoading(action)
    try {
      const response = await fetch(`/api/gateway/${gatewayConnectionId}/${action}`, { method: "POST" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Operation impossible.")
      if (action === "test") toast.success("Capabilities valides")
      if (action === "inspect-schema") toast.success("Schema inspecte", { description: `${payload.schema.objects.length} objets detectes.` })
      if (action === "sync") toast.success("Synchronisation Gateway terminee", { description: `${payload.syncRun.recordsInserted} evenements inseres.` })
    } catch (error) {
      toast.error("Operation Gateway echouee", {
        description: error instanceof Error ? error.message : "Erreur inconnue.",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => call("test")} disabled={loading != null}>
        <ShieldCheck className="size-4" /> Tester
      </Button>
      <Button size="sm" variant="outline" onClick={() => call("inspect-schema")} disabled={loading != null}>
        <Database className="size-4" /> Inspecter
      </Button>
      <Button size="sm" variant="outline" onClick={() => call("sync")} disabled={loading != null}>
        <RefreshCw className={`size-4 ${loading === "sync" ? "animate-spin" : ""}`} /> Synchroniser
      </Button>
    </div>
  )
}
