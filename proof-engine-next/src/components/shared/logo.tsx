import { cn } from "@/lib/utils"
import { product } from "@/config/product"

export function Logo({ size = 28, withText = true, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path
          d="M11 8h8a6 6 0 0 1 0 12h-4v4h-4V8Zm4 4v4h4a2 2 0 0 0 0-4h-4Z"
          className="fill-primary-foreground"
        />
      </svg>
      {withText && <span className="text-lg font-semibold tracking-tight">{product.name}</span>}
    </span>
  )
}
