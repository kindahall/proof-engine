import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { requireSupabasePublicConfig } from "@/lib/supabase/env"

interface PendingCookie {
  name: string
  value: string
  options: CookieOptions
}

export function createSupabaseCookieClient(request: NextRequest) {
  const { url, publishableKey } = requireSupabasePublicConfig()
  const pendingCookies: PendingCookie[] = []
  const pendingHeaders = new Map<string, string>()

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        pendingCookies.push(...cookiesToSet)
        Object.entries(headers).forEach(([key, value]) => pendingHeaders.set(key, value))
      },
    },
  })

  function applyCookies<T extends NextResponse>(response: T) {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    pendingHeaders.forEach((value, key) => {
      response.headers.set(key, value)
    })
    return response
  }

  return { supabase, applyCookies }
}

export function createSupabaseProxyClient(request: NextRequest) {
  const { url, publishableKey } = requireSupabasePublicConfig()
  const pendingCookies: PendingCookie[] = []
  const pendingHeaders = new Map<string, string>()
  let response = NextResponse.next({ request })

  function applyCookies<T extends NextResponse>(target: T) {
    pendingCookies.forEach(({ name, value, options }) => {
      target.cookies.set(name, value, options)
    })
    pendingHeaders.forEach((value, key) => {
      target.headers.set(key, value)
    })
    return target
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          pendingCookies.push({ name, value, options })
        })
        Object.entries(headers).forEach(([key, value]) => {
          pendingHeaders.set(key, value)
        })
        response = applyCookies(NextResponse.next({ request }))
      },
    },
  })

  return {
    supabase,
    applyCookies,
    getResponse() {
      return applyCookies(response)
    },
  }
}
