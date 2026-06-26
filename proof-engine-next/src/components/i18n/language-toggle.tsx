"use client"

import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "./language-provider"
import type { Language } from "@/lib/i18n/dom-translations"

const options: Array<{ value: Language; label: string }> = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
]

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage()

  return (
    <div
      className={cn("inline-flex h-9 items-center rounded-md border bg-background p-0.5", className)}
      role="group"
      aria-label="Language"
    >
      <span className="flex size-7 items-center justify-center text-muted-foreground">
        <Languages className="size-4" aria-hidden="true" />
      </span>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={language === option.value ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          aria-pressed={language === option.value}
          onClick={() => setLanguage(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
