"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { trackPageView } from "@/lib/marketing-analytics/client"

export function MarketingAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return

    trackPageView({
      path: window.location.pathname,
      referrer: document.referrer,
      search: window.location.search,
      title: document.title,
      url: window.location.href,
    })
  }, [pathname])

  return null
}
