import Link from "next/link"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-semibold text-muted-foreground/30">404</p>
      <h1 className="mt-2 text-lg font-semibold">Cette page est introuvable.</h1>
      <p className="mt-1 text-sm text-muted-foreground">Elle a peut-être été déplacée ou supprimée.</p>
      <Button asChild className="mt-5">
        <Link href={routes.dashboard}>Retour au tableau de bord</Link>
      </Button>
    </div>
  )
}
