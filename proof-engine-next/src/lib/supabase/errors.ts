import { SupabaseConfigError } from "@/lib/supabase/env"

type SupabaseLikeError = {
  code?: unknown
  message?: unknown
}

export function isSupabaseSchemaCacheError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const supabaseError = error as SupabaseLikeError
  return (
    supabaseError.code === "PGRST205" ||
    (typeof supabaseError.message === "string" && supabaseError.message.includes("schema cache"))
  )
}

export function toSupabaseOperationalError(error: unknown) {
  if (error instanceof SupabaseConfigError) {
    return {
      error: error.code,
      message: error.message,
    }
  }

  if (isSupabaseSchemaCacheError(error)) {
    return {
      error: "supabase_schema_not_ready",
      message: "Le schéma Supabase Proof Engine n'est pas encore appliqué ou exposé au projet distant.",
    }
  }

  return null
}
