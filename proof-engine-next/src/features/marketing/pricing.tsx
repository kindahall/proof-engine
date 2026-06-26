"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { plans } from "./content"
import { routes } from "@/lib/routes"
import { trackSubscriptionPlanSelected } from "@/lib/marketing-analytics/client"
import type { BillingInterval } from "@/lib/marketing-analytics/events"

export function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm", !yearly && "font-medium")}>Mensuel</span>
        <button
          onClick={() => setYearly((v) => !v)}
          className="relative h-6 w-11 rounded-full bg-muted transition-colors"
          aria-label="Basculer la facturation annuelle"
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-primary transition-transform",
              yearly ? "translate-x-[22px]" : "translate-x-0.5",
            )}
          />
        </button>
        <span className={cn("text-sm", yearly && "font-medium")}>
          Annuel <span className="text-emerald-600">−20 %</span>
        </span>
      </div>

      <div className="mt-10 grid items-stretch gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const billingInterval: BillingInterval = yearly ? "yearly" : "monthly"
          const price = yearly ? p.yearly : p.monthly
          const destination = p.name === "Scale" ? "contact" : "onboarding"
          return (
            <div
              key={p.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                p.highlight && "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  <Sparkles className="size-3" /> Le plus choisi
                </span>
              )}
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-4 text-4xl font-bold">
                {price === 0 ? "0€" : `${price}€`}
                <span className="text-base font-normal text-muted-foreground"> / mois</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={p.highlight ? "default" : "outline"}>
                <Link
                  href={p.name === "Scale" ? "#contact" : routes.onboarding}
                  onClick={() =>
                    trackSubscriptionPlanSelected({
                      billingInterval,
                      destination,
                      plan: p,
                      source: "pricing_card",
                    })
                  }
                >
                  {p.cta}
                </Link>
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
