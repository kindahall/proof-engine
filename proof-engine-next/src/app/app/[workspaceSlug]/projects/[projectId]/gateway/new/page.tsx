"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, CircleCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { ToneBadge } from "@/components/shared/tone-badge"
import { toast } from "sonner"

const PROVIDERS = [
  { id: "http_gateway", label: "Gateway HTTP" },
]

export default function NewGatewayPage() {
  const router = useRouter()
  const params = useParams<{ workspaceSlug: string; projectId: string }>()
  const gatewayBasePath = `/app/${params.workspaceSlug}/projects/${params.projectId}/gateway`
  const [tested, setTested] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [provider, setProvider] = useState("http_gateway")
  const [name, setName] = useState("Gateway HTTP")
  const [endpoint, setEndpoint] = useState("")
  const [token, setToken] = useState("")

  const transport = "http"
  const canTest = name.trim().length > 0 && endpoint.trim().length > 0

  function updateProvider(value: string) {
    setProvider(value)
    setTested(false)
  }

  function updateName(value: string) {
    setName(value)
    setTested(false)
  }

  function updateEndpoint(value: string) {
    setEndpoint(value)
    setTested(false)
  }

  function updateToken(value: string) {
    setToken(value)
    setTested(false)
  }

  async function testGateway() {
    setTesting(true)
    setTested(false)
    try {
      const response = await fetch("/api/gateway/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, name, transport, endpoint, token: token || undefined }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message ?? "Capabilities indisponibles.")
      setTested(true)
      toast.success("Gateway valide", { description: `${payload.capabilities.length} capabilities detectees.` })
    } catch (error) {
      toast.error("Test Gateway impossible", {
        description: error instanceof Error ? error.message : "Erreur inconnue.",
      })
    } finally {
      setTesting(false)
    }
  }

  async function activateGateway() {
    setSaving(true)
    try {
      const response = await fetch("/api/gateway", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, name, transport, endpoint, token: token || undefined }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message ?? payload.health?.message ?? "Activation impossible.")
      toast.success("Gateway activé")
      router.push(payload.profile?.id ? `${gatewayBasePath}/${payload.profile.id}` : gatewayBasePath)
    } catch (error) {
      toast.error("Activation Gateway impossible", {
        description: error instanceof Error ? error.message : "Erreur inconnue.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href={gatewayBasePath} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Gateway
      </Link>
      <PageHeader title="Nouveau Gateway" description="Profil de connexion en lecture seule." />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label>Fournisseur</Label>
            <Select value={provider} onValueChange={updateProvider}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={name} onChange={(event) => updateName(event.target.value)} placeholder="Ex. Gateway production" />
          </div>
          <div className="space-y-1.5">
            <Label>Endpoint</Label>
            <Input value={endpoint} onChange={(event) => updateEndpoint(event.target.value)} placeholder="https://gateway.example.com/proof-engine" />
          </div>
          <div className="space-y-1.5">
            <Label>Token (chiffré côté serveur)</Label>
            <Input value={token} onChange={(event) => updateToken(event.target.value)} type="password" placeholder="••••••••" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={testGateway}
              disabled={!canTest || testing || saving}
            >
              {testing ? <Loader2 className="size-4 animate-spin" /> : "Tester la connexion"}
            </Button>
            {tested && (
              <ToneBadge tone="success">
                <CircleCheck className="size-3.5" /> Capabilities minimales disponibles
              </ToneBadge>
            )}
          </div>
          <div className="flex justify-end border-t pt-4">
            <Button disabled={!tested || saving} onClick={activateGateway}>
              Activer le Gateway
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
