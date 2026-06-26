export class SupabaseConfigError extends Error {
  readonly code = "supabase_not_configured"

  constructor(message = "Supabase n'est pas configuré pour cet environnement.") {
    super(message)
    this.name = "SupabaseConfigError"
  }
}

export interface SupabasePublicConfig {
  url: string
  publishableKey: string
}

function clean(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const publishableKey = clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

  if (!url || !publishableKey) return null
  return { url, publishableKey }
}

export function requireSupabasePublicConfig() {
  const config = getSupabasePublicConfig()
  if (!config) {
    throw new SupabaseConfigError(
      "NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY sont requis.",
    )
  }
  return config
}

export function getSupabaseSecretKey() {
  return clean(process.env.SUPABASE_SECRET_KEY)
}

export function requireSupabaseSecretKey() {
  const secretKey = getSupabaseSecretKey()
  if (!secretKey) {
    throw new SupabaseConfigError("SUPABASE_SECRET_KEY est requis pour provisionner les profils.")
  }
  return secretKey
}

export function isSupabaseConfigured() {
  return Boolean(getSupabasePublicConfig())
}

export function isSupabaseServerConfigured() {
  return Boolean(getSupabasePublicConfig() && getSupabaseSecretKey())
}
