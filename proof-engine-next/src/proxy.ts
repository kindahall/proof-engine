import { NextResponse, type NextRequest } from "next/server"
import {
  buildLoginRedirectPath,
  buildPostAuthRedirectPath,
} from "@/lib/auth/redirects"
import { SupabaseConfigError, isSupabaseConfigured } from "@/lib/supabase/env"
import { createSupabaseProxyClient } from "@/lib/supabase/request"

const authPaths = new Set(["/login", "/signup"])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestedPath = `${pathname}${request.nextUrl.search}`
  const isAppPath = pathname === "/app" || pathname.startsWith("/app/")
  const isAuthPath = authPaths.has(pathname)

  if (!isSupabaseConfigured()) {
    if (isAppPath) {
      return NextResponse.redirect(new URL(buildLoginRedirectPath(requestedPath), request.url))
    }
    return NextResponse.next()
  }

  try {
    const { supabase, applyCookies, getResponse } = createSupabaseProxyClient(request)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (isAppPath && !user) {
      return applyCookies(
        NextResponse.redirect(new URL(buildLoginRedirectPath(requestedPath), request.url)),
      )
    }

    if (isAuthPath && user) {
      return applyCookies(
        NextResponse.redirect(new URL(buildPostAuthRedirectPath(), request.url)),
      )
    }

    return getResponse()
  } catch (error) {
    if (error instanceof SupabaseConfigError && isAppPath) {
      return NextResponse.redirect(new URL(buildLoginRedirectPath(requestedPath), request.url))
    }
    throw error
  }
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
}
