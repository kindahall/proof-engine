import { NextResponse } from "next/server"
import { z } from "zod"
import { handleApiError } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/api"
import {
  updateSettingsForUser,
  WorkspaceSlugTakenError,
} from "@/lib/persistence/supabase"
import { isSupabaseServerConfigured } from "@/lib/supabase/env"

const textField = z.string().trim().max(1_000)
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const settingsUpdateSchema = z.object({
  workspace: z.object({
    name: z.string().trim().min(1).max(120),
    slug: slugSchema,
    plan: z.string().trim().min(1).max(40),
  }),
  project: z.object({
    name: z.string().trim().min(1).max(160),
    websiteUrl: z.string().trim().max(500),
    description: textField,
    productType: textField,
    businessModel: textField,
    stage: textField,
    targetSegment: textField,
    primaryUser: textField,
    problem: textField,
    buyingTrigger: textField,
    currentAlternative: textField,
    valueProposition: textField,
    pricing: textField,
    activationDefinition: textField,
  }),
})

export async function PATCH(request: Request) {
  try {
    const auth = await requireApiUser()
    if (!auth.ok) return auth.response

    if (!isSupabaseServerConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "supabase_not_configured",
          message: "Supabase server-side doit être configuré pour sauvegarder les paramètres.",
        },
        { status: 503 },
      )
    }

    const parsed = settingsUpdateSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_payload",
          message: "Paramètres invalides.",
        },
        { status: 400 },
      )
    }

    const settings = await updateSettingsForUser({
      user: auth.user,
      workspace: parsed.data.workspace,
      project: parsed.data.project,
    })

    return NextResponse.json({
      ok: true,
      workspace: settings.workspace,
      project: settings.project,
      redirectTo: `/app/${settings.context.workspaceSlug}/settings`,
    })
  } catch (error) {
    if (error instanceof WorkspaceSlugTakenError) {
      return NextResponse.json(
        {
          ok: false,
          error: "workspace_slug_taken",
          message: error.message,
        },
        { status: 409 },
      )
    }
    return handleApiError(error, { route: "/api/settings", operation: "PATCH" })
  }
}
