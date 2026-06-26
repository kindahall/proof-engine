"use client"

import { useState } from "react"
import { Play, RefreshCw, Square } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function ExperimentActions({ experimentId, status }: { experimentId: string; status: string }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function call(action: "start" | "sync" | "complete") {
    setLoading(action)
    try {
      const response = await fetch(`/api/experiments/${experimentId}/${action}`, { method: "POST" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.reason ?? payload.error ?? "Operation impossible.")
      if (action === "start") toast.success("Experience demarree")
      if (action === "sync") toast.success("Resultats synchronises", { description: payload.metric?.name ?? "Metrique a jour." })
      if (action === "complete") toast.success("Experience cloturee", { description: payload.decision?.reason })
    } catch (error) {
      toast.error("Action impossible", {
        description: error instanceof Error ? error.message : "Erreur inconnue.",
      })
    } finally {
      setLoading(null)
    }
  }

  if (status === "ready" || status === "draft") {
    return (
      <Button size="sm" onClick={() => call("start")} disabled={loading != null}>
        <Play className="size-4" /> Demarrer
      </Button>
    )
  }

  if (status === "running") {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => call("sync")} disabled={loading != null}>
          <RefreshCw className={`size-4 ${loading === "sync" ? "animate-spin" : ""}`} /> Synchroniser
        </Button>
        <Button size="sm" variant="outline" onClick={() => call("complete")} disabled={loading != null}>
          <Square className="size-4" /> Terminer
        </Button>
      </div>
    )
  }

  return null
}
