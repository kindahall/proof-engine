"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { features } from "./content"

const ROTATE_INTERVAL_MS = 5000

export function FeatureShowcase() {
  const [active, setActive] = useState(features[0].key)
  const current = features.find((f) => f.key === active)!

  // Auto-rotate through the tabs. Re-running on `active` change means a manual
  // tab click also resets the countdown so it doesn't jump right after.
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((currentKey) => {
        const index = features.findIndex((f) => f.key === currentKey)
        return features[(index + 1) % features.length].key
      })
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [active])

  return (
    <div>
      {/* Interactive tabs */}
      <div className="flex flex-wrap gap-2">
        {features.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
              active === f.key
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {f.tab}
          </button>
        ))}
      </div>

      <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
        <div key={current.key} className="pe-reveal" data-shown="true">
          <h3 className="text-2xl font-semibold tracking-tight">{current.title}</h3>
          <p className="mt-3 text-muted-foreground">{current.text}</p>
          <ul className="mt-5 space-y-2.5">
            {current.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Check className="size-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl opacity-50 blur-2xl"
            style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--primary) 20%, transparent), transparent 70%)" }}
          />
          <div className="overflow-hidden rounded-2xl border shadow-xl">
            <Image
              key={current.image}
              src={current.image}
              alt={current.alt}
              width={1448}
              height={1086}
              className="h-full w-full object-cover"
              priority={current.key === features[0].key}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
