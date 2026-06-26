import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { LanguageToggle } from "@/components/i18n/language-toggle"
import { routes } from "@/lib/routes"

export const metadata = { title: "Confidentialité" }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href={routes.marketing}><Logo /></Link>
        <LanguageToggle />
      </div>
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Proof Engine traite les données synchronisées pour produire des diagnostics fondés sur
        preuves. Les secrets de connecteurs sont chiffrés côté serveur et ne transitent jamais par
        le navigateur.
      </p>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>Les données synchronisées sont isolées par espace de travail et par projet.</p>
        <p>Aucune donnée n'est revendue. Les connecteurs peuvent être supprimés à tout moment, avec leurs secrets.</p>
        <p>
          Si l'analytics marketing est activé, seules les pages vues et les événements de conversion
          nécessaires au pilotage des campagnes sont envoyés au SDK configuré. Les formulaires ne
          transmettent pas d'email, de nom ni de secret de connecteur via ce tracking navigateur.
        </p>
      </div>
    </div>
  )
}
