import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  requireSupabasePublicConfig,
  requireSupabaseSecretKey,
} from "@/lib/supabase/env"

let adminClient: SupabaseClient | null = null

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { url, publishableKey } = requireSupabasePublicConfig()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
          void headers
        } catch {
          // Server Components cannot write cookies. The proxy refreshes sessions before render.
        }
      },
    },
  })
}

export function createSupabaseAdminClient() {
  if (adminClient) return adminClient

  const { url } = requireSupabasePublicConfig()
  adminClient = createClient(url, requireSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return adminClient
}
