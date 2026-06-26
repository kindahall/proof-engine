import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import {
  listPersistedConnectorsForUser,
  listPersistedDiagnosticsForUser,
  listPersistedEventMappingsForUser,
  listPersistedEvidenceForUser,
  listPersistedExperimentsForUser,
  listPersistedGatewayProfilesForUser,
  listPersistedLearningsForUser,
  loadPersistedRuntimeState,
  loadSettingsForUser,
} from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

export async function GET() {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    if (!isSupabaseServerConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "supabase_not_configured",
          message: "Supabase server-side doit être configuré pour exporter les données.",
        },
        { status: 503 },
      )
    }

    const [
      settings,
      connectors,
      gatewayProfiles,
      eventMappings,
      evidence,
      runtime,
      diagnostics,
      experiments,
      learnings,
    ] = await Promise.all([
      loadSettingsForUser(auth.user),
      listPersistedConnectorsForUser(auth.user),
      listPersistedGatewayProfilesForUser(auth.user),
      listPersistedEventMappingsForUser(auth.user),
      listPersistedEvidenceForUser(auth.user),
      loadPersistedRuntimeState(auth.user),
      listPersistedDiagnosticsForUser(auth.user),
      listPersistedExperimentsForUser(auth.user),
      listPersistedLearningsForUser(auth.user),
    ])

    const exportedAt = new Date().toISOString()
    const payload = {
      ok: true,
      exportedAt,
      user: {
        id: auth.user.id,
        email: auth.user.email ?? null,
      },
      workspace: settings.workspace,
      project: settings.project,
      members: settings.members,
      connectors,
      gatewayProfiles,
      eventMappings,
      evidence,
      diagnostics,
      experiments,
      learnings,
      runtime: {
        rawEvents: runtime.rawEvents,
        syncRuns: runtime.syncRuns,
        metricSnapshots: runtime.metricSnapshots,
      },
    }
    const filename = `proof-engine-${settings.workspace.slug}-${exportedAt.slice(0, 10)}.json`

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return handleApiError(error, { route: "/api/settings/export", operation: "GET" })
  }
}
