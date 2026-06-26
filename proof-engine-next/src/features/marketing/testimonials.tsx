import { Quote } from "lucide-react"
import { testimonials } from "./content"

export function Testimonials() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {testimonials.map((t) => (
        <figure
          key={t.name}
          className="flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <Quote className="size-6 text-primary/30" />
          <blockquote className="mt-3 flex-1 text-sm leading-relaxed">“{t.quote}”</blockquote>
          <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {t.initials}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-medium">{t.name}</span>
              <span className="block text-xs text-muted-foreground">{t.role}</span>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
