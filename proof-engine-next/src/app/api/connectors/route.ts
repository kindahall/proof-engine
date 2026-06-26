import { NextResponse } from "next/server"
import { z } from "zod"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import { connectorProviderSchema } from "@/lib/connectors/schemas"
import { saveConnectorConnection } from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

const connectorCreateSchema = z.object({
  provider: connectorProviderSchema,
  name: z.string().trim().min(1),
  endpoint: z.string().trim().optional(),
  secret: z.string().trim().optional(),
  eventsTable: z.string().trim().optional(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    if (!isSupabaseServerConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "supabase_not_configured",
          message: "Supabase server-side doit être configuré pour sauvegarder un connecteur.",
        },
        { status: 503 },
      )
    }

    const parsed = connectorCreateSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_payload", message: "Paramètres de connecteur invalides." },
        { status: 400 },
      )
    }

    const result = await saveConnectorConnection({
      user: auth.user,
      provider: parsed.data.provider,
      name: parsed.data.name,
      endpoint: parsed.data.endpoint,
      secret: parsed.data.secret,
      eventsTable: parsed.data.eventsTable,
    })

    return NextResponse.json({
      ok: true,
      dataSourceId: result.connector.id,
      connector: result.connector,
      workspace: {
        id: result.context.workspaceId,
        slug: result.context.workspaceSlug,
        projectId: result.context.projectId,
      },
    })
  } catch (error) {
    return handleApiError(error, { route: "/api/connectors", operation: "POST" })
  }
}
