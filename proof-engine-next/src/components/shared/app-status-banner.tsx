import { Info } from "lucide-react"

export function AppStatusBanner() {
  return (
    <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0" />
      <span>
        Configuration locale — connectez Supabase côté serveur pour activer la persistance, les secrets chiffrés et les synchronisations réelles.
      </span>
    </div>
  )
}
