"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/shared/logo"
import { LanguageToggle } from "@/components/i18n/language-toggle"
import { routes } from "@/lib/routes"
import { trackSignupCompleted } from "@/lib/marketing-analytics/client"

export function AuthCard({
  mode,
}: {
  mode: "login" | "signup"
}) {
  const router = useRouter()
  const isLogin = mode === "login"
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(event.currentTarget)
    const payload = {
      fullName: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      next: new URLSearchParams(window.location.search).get("next"),
    }

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        message?: string
        redirectTo?: string | null
        requiresEmailConfirmation?: boolean
      }

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Authentification impossible.")
      }

      if (!isLogin) {
        trackSignupCompleted({
          auth_method: "email_password",
          destination: result.requiresEmailConfirmation ? "email_confirmation" : "onboarding",
          source: "signup_form",
        })
      }

      if (result.requiresEmailConfirmation) {
        setSuccess(result.message ?? "Compte créé. Vérifiez votre email avant de vous connecter.")
        return
      }

      router.push(result.redirectTo ?? (isLogin ? routes.dashboard : routes.onboarding))
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentification impossible.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href={routes.marketing}><Logo /></Link>
        <LanguageToggle />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-24">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">
            {isLogin ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin ? "Accédez à votre espace de travail." : "Quelques secondes pour démarrer."}
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit}
          >
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" name="name" autoComplete="name" placeholder="Camille Martin" required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="vous@entreprise.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={isLogin ? undefined : 8}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                {success}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isLogin ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>Pas encore de compte ? <Link href={routes.signup} className="font-medium text-primary">Créer un compte</Link></>
            ) : (
              <>Déjà un compte ? <Link href={routes.login} className="font-medium text-primary">Se connecter</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
