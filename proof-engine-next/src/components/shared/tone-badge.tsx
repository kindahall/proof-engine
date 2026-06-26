import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Tone = "default" | "secondary" | "outline" | "destructive" | "success" | "warning"

const toneClass: Record<Tone, string> = {
  default: "",
  secondary: "",
  outline: "",
  destructive: "",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
}

export function ToneBadge({
  tone = "default",
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: React.ReactNode
}) {
  const variant =
    tone === "destructive" ? "destructive" : tone === "outline" ? "outline" : tone === "secondary" ? "secondary" : "default"
  return (
    <Badge variant={variant} className={cn(toneClass[tone], className)}>
      {children}
    </Badge>
  )
}
