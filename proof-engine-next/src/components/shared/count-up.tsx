"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Animated number that counts up from 0 to `value` the first time it scrolls
 * into view. Uses tabular figures so the width stays stable while animating
 * (keeps the current Geist typography, only stabilises digit width).
 */
export function CountUp({
  value,
  durationMs = 1100,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  locale = "fr-FR",
}: {
  value: number
  durationMs?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  locale?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        if (reduce) {
          setDisplay(value)
          return
        }
        let raf = 0
        let start = 0
        const tick = (now: number) => {
          if (!start) start = now
          const p = Math.min(1, (now - start) / durationMs)
          const eased = 1 - Math.pow(1 - p, 3)
          setDisplay(value * eased)
          if (p < 1) raf = requestAnimationFrame(tick)
          else setDisplay(value)
        }
        raf = requestAnimationFrame(tick)
        cleanup = () => cancelAnimationFrame(raf)
      },
      { threshold: 0.3 },
    )

    let cleanup = () => {}
    io.observe(el)
    return () => {
      io.disconnect()
      cleanup()
    }
  }, [value, durationMs])

  const formatted = display.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
