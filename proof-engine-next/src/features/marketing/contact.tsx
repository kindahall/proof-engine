"use client"

import { type FormEvent, useState } from "react"
import { Mail, Send, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  trackContactSubmitted,
  trackSubscriptionIntentCaptured,
} from "@/lib/marketing-analytics/client"

export function Contact() {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackHref, setFallbackHref] = useState("mailto:hello@proofengine.app")

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      source: "marketing_contact_form",
    }

    setSending(true)
    setError(null)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as {
        ok?: boolean
        message?: string
        mailto?: string
      }

      if (!response.ok || !result.ok) {
        setError(result.message ?? "Le message n'a pas pu être transmis.")
        if (result.mailto) setFallbackHref(result.mailto)
        toast.error("Message non transmis", {
          description: "Utilisez l'adresse email directe si besoin.",
        })
        return
      }

      trackContactSubmitted({
        destination: "sales_contact",
        source: "marketing_contact_form",
      })
      trackSubscriptionIntentCaptured({
        intent_stage: "contact_submitted",
        plan_id: "scale",
        plan_name: "Scale",
        source: "marketing_contact_form",
      })
      setSent(true)
      form.reset()
      toast.success("Message transmis", { description: "On vous répond très vite." })
    } catch {
      setError("Le canal contact est indisponible pour le moment.")
      toast.error("Message non transmis", {
        description: "Utilisez l'adresse email directe si besoin.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <p className="text-sm font-medium text-primary">Contact</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Une question ? Parlons-en.</h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Démo, intégration backend, plan Scale : écrivez-nous, on répond sous 24 h ouvrées.
        </p>
        <a
          href="mailto:hello@proofengine.app"
          className="mt-5 inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
        >
          <Mail className="size-4 text-primary" /> hello@proofengine.app
        </a>
      </div>

      <form
        className="rounded-2xl border bg-card p-6"
        onSubmit={submitContact}
      >
        {sent ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="size-10 text-emerald-500" />
            <p className="mt-3 font-medium">Merci, c'est transmis.</p>
            <p className="mt-1 text-sm text-muted-foreground">On revient vers vous rapidement.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Nom</Label>
                <Input id="c-name" name="name" placeholder="Votre nom" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" name="email" type="email" placeholder="vous@entreprise.com" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-msg">Message</Label>
              <Textarea id="c-msg" name="message" placeholder="Parlez-nous de votre produit…" rows={4} required />
            </div>
            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>
                  {error}{" "}
                  <a href={fallbackHref} className="font-medium underline underline-offset-4">
                    Écrire par email.
                  </a>
                </p>
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Transmission..." : "Envoyer"} <Send className="size-4" />
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
