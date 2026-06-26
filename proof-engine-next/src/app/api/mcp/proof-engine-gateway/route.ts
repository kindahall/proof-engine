import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { getRuntimeState } from "@/lib/runtime/store"
import { computeFunnelSnapshot } from "@/lib/analytics/metrics"
import { buildInternalGatewayHealth, buildInternalGatewaySchema } from "@/lib/gateway/internal"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"
import { loadPersistedRuntimeState } from "@/lib/persistence/supabase"

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    const state = isSupabaseServerConfigured() ? await loadPersistedRuntimeState(auth.user) : getRuntimeState()
    const body = await request.json().catch(() => ({}))
    const operation = typeof body.operation === "string" ? body.operation : "health.check"

    if (operation === "health.check") {
      return NextResponse.json(buildInternalGatewayHealth())
    }
    if (operation === "schema.inspect") {
      return NextResponse.json(buildInternalGatewaySchema({ events: state.rawEvents, metrics: state.metricSnapshots }))
    }
    if (operation === "events.read") {
      return NextResponse.json({ events: state.rawEvents.slice(0, 5000) })
    }
    if (operation === "metrics.read") {
      return NextResponse.json({ metrics: state.metricSnapshots })
    }
    if (operation === "funnels.compute") {
      return NextResponse.json({ funnel: computeFunnelSnapshot(state.rawEvents) })
    }

    return NextResponse.json({ ok: false, error: "operation_not_allowed" }, { status: 403 })
  } catch (error) {
    return handleApiError(error, { route: "/api/mcp/proof-engine-gateway", operation: "POST" })
  }
}
