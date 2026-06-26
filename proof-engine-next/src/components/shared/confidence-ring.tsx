"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Radial gauge for a 0-100 score. The ring sweep and the centre number animate
 * together the first time it enters the viewport. Uses the app's --primary token
 * so it inherits the current theme colour.
 */
export function ConfidenceRing({
  value,
  label = "confiance",
  size = 128,
  className,
}: {
  value: number
  label?: string
  size?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        if (reduce) {
          setV(value)
          return
        }
        let raf = 0
        let start = 0
        const tick = (now: number) => {
          if (!start) start = now
          const p = Math.min(1, (now - start) / 1100)
          const eased = 1 - Math.pow(1 - p, 3)
          setV(Math.round(value * eased))
          if (p < 1) raf = requestAnimationFrame(tick)
          else setV(value)
        }
        raf = requestAnimationFrame(tick)
        cleanup = () => cancelAnimationFrame(raf)
      },
      { threshold: 0.4 },
    )

    let cleanup = () => {}
    io.observe(el)
    return () => {
      io.disconnect()
      cleanup()
    }
  }, [value])

  const inner = size - 36

  return (
    <div
      ref={ref}
      className={cn("relative grid shrink-0 place-items-center rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--primary) ${v * 3.6}deg, color-mix(in oklch, var(--primary) 12%, transparent) 0deg)`,
        transition: "background 0.1s linear",
      }}
    >
      <div className="grid place-items-center rounded-full bg-card" style={{ width: inner, height: inner }}>
        <span className="text-3xl font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
          {v}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
