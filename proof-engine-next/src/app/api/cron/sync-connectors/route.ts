import { NextResponse } from "next/server"
import { syncAllConnectors } from "@/lib/connectors/service"
import { captureEvent } from "@/lib/observability/server"

export async function POST(request: Request) {
  const configured = process.env.CONNECTOR_SYNC_CRON_SECRET
  if (process.env.NODE_ENV === "production" && !configured) {
    captureEvent({
      level: "error",
      event: "proof_engine.cron_secret_missing",
      route: "/api/cron/sync-connectors",
      operation: "POST",
    })
    return NextResponse.json({ ok: false, error: "cron_secret_not_configured" }, { status: 500 })
  }

  if (configured && request.headers.get("x-cron-secret") !== configured) {
    captureEvent({
      level: "warn",
      event: "proof_engine.cron_secret_rejected",
      route: "/api/cron/sync-connectors",
      operation: "POST",
    })
    return NextResponse.json({ ok: false, error: "invalid_cron_secret" }, { status: 401 })
  }

  const runs = await syncAllConnectors()
  return NextResponse.json({
    ok: runs.every((run) => run.status === "success"),
    runs,
  })
}
