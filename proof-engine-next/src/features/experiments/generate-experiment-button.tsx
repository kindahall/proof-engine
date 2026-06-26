"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FlaskConical } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function GenerateExperimentButton({
  workspaceSlug,
  projectId,
  disabled,
}: {
  workspaceSlug: string
  projectId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function generateExperiment() {
    setLoading(true)
    try {
      const response = await fetch("/api/experiments/generate", { method: "POST" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message ?? payload.reason ?? "Génération impossible.")
      const id = payload.experiment?.id
      toast.success("Expérience générée")
      if (id) router.push(`/app/${workspaceSlug}/projects/${projectId}/experiments/${id}`)
      else router.refresh()
    } catch (error) {
      toast.error("Expérience non générée", {
        description: error instanceof Error ? error.message : "Erreur inconnue.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={generateExperiment} disabled={disabled || loading}>
      <FlaskConical className={`size-4 ${loading ? "animate-pulse" : ""}`} />
      Générer l'expérience
    </Button>
  )
}
