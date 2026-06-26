import { requireAuthenticatedUser } from "@/lib/auth/session"
import { ensureWorkspaceForUser } from "@/lib/persistence/supabase"
import { captureException } from "@/lib/observability/server"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import { toSupabaseOperationalError } from "@/lib/supabase/errors"

export const dynamic = "force-dynamic"

export default async function AppRootLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthenticatedUser()
  if (isSupabaseServerConfigured()) {
    try {
      await ensureWorkspaceForUser(user)
    } catch (error) {
      const supabaseError = toSupabaseOperationalError(error)
      if (supabaseError) {
        captureException(error, {
          level: "warn",
          event: "proof_engine.app_supabase_setup_required",
          route: "/app",
          operation: "ensure_workspace",
          userId: user.id,
          errorCode: supabaseError.error,
        })
        return <SupabaseSetupRequired message={supabaseError.message} />
      }
      captureException(error, {
        level: "error",
        event: "proof_engine.app_layout_error",
        route: "/app",
        operation: "ensure_workspace",
        userId: user.id,
      })
      throw error
    }
  }

  return children
}

function SupabaseSetupRequired({ message }: { message: string }) {
  const commands = [
    "pnpm exec supabase login",
    "pnpm exec supabase link --project-ref kegwmanuetudhkycnhdu",
    "pnpm exec supabase db push",
    "pnpm supabase:check",
  ]

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-lg border bg-background p-6 shadow-sm">
        <p className="text-sm font-medium text-amber-600">Configuration Supabase requise</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Schéma Proof Engine indisponible</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 rounded-md border bg-muted/40 p-4 font-mono text-xs">
          {commands.map((command) => (
            <p key={command}>{command}</p>
          ))}
        </div>
      </div>
    </main>
  )
}
