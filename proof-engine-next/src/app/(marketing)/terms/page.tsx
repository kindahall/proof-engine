import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { LanguageToggle } from "@/components/i18n/language-toggle"
import { routes } from "@/lib/routes"

export const metadata = { title: "Conditions d'utilisation" }

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href={routes.marketing}><Logo /></Link>
        <LanguageToggle />
      </div>
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Conditions d'utilisation</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Le service fournit des diagnostics fondés sur les données réelles connectées et ne garantit
        aucun résultat commercial.
      </p>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>Les recommandations sont des aides à la décision et restent modifiables par l'utilisateur.</p>
        <p>Le produit n'écrit jamais dans les backends analysés et n'envoie aucune campagne automatiquement.</p>
      </div>
    </div>
  )
}
