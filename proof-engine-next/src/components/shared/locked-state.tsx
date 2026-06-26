import Link from "next/link"
import { Lock, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"

/**
 * Elegant locked / empty state for features that stay unavailable until a real
 * source is connected. Soft gradient aura, glowing icon, single clear CTA.
 */
export function LockedState({
  icon: Icon,
  title,
  description,
  preview,
  connectorHref = routes.connectorNew,
  dataQualityHref = routes.dataQuality,
}: {
  icon: LucideIcon
  title: string
  description: string
  preview?: React.ReactNode
  connectorHref?: string
  dataQualityHref?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--primary) 18%, transparent), transparent 70%)" }}
      />
      {preview && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] blur-[2px]">{preview}</div>
      )}
      <div className="relative flex flex-col items-center px-6 py-14 text-center">
        <div className="relative">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
            <Icon className="size-6 text-primary" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border bg-muted text-muted-foreground">
            <Lock className="size-3" />
          </span>
        </div>
        <h3 className="mt-5 text-lg font-semibold">{title}</h3>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href={connectorHref}>Connecter une source</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={dataQualityHref}>Voir les contrôles</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
