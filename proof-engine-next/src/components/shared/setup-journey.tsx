import { Check, Database, ScanSearch, GitBranch, ShieldCheck, Compass } from "lucide-react"
import { cn } from "@/lib/utils"

type StepStatus = "done" | "current" | "todo"

const STEPS = [
  { icon: Database, title: "Connecter une source", desc: "Postgres, Supabase, Firebase… en lecture seule" },
  { icon: ScanSearch, title: "Inspecter les données", desc: "Détecter les événements" },
  { icon: GitBranch, title: "Mapper les événements", desc: "Vers le format canonique" },
  { icon: ShieldCheck, title: "Vérifier la qualité", desc: "Débloquer le diagnostic" },
  { icon: Compass, title: "Lancer le diagnostic", desc: "Trouver le goulot" },
]

/** Beautiful horizontal setup stepper for the empty / getting-started state. */
export function SetupJourney({ current = 0 }: { current?: number }) {
  const statusOf = (i: number): StepStatus => (i < current ? "done" : i === current ? "current" : "todo")

  return (
    <div className="relative">
      {/* connecting line */}
      <div className="absolute left-5 right-5 top-5 hidden h-px bg-border md:block" />
      <div
        className="absolute left-5 top-5 hidden h-px bg-gradient-to-r from-primary to-primary/40 md:block"
        style={{ width: `calc((100% - 2.5rem) * ${current / (STEPS.length - 1)})` }}
      />

      <ol className="grid gap-5 md:grid-cols-5 md:gap-2">
        {STEPS.map((s, i) => {
          const status = statusOf(i)
          return (
            <li key={s.title} className="relative flex gap-3 md:flex-col md:items-center md:text-center">
              <div
                className={cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  status === "done" && "border-primary bg-primary text-primary-foreground",
                  status === "current" && "border-primary bg-background text-primary shadow-[0_0_0_4px] shadow-primary/15",
                  status === "todo" && "border-border bg-muted text-muted-foreground",
                )}
              >
                {status === "done" ? <Check className="size-4" /> : <s.icon className="size-4" />}
              </div>
              <div className="md:mt-2">
                <p className={cn("text-sm font-medium", status === "todo" && "text-muted-foreground")}>{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
