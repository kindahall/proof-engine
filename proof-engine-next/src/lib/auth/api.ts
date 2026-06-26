import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/session"

export async function requireApiUser() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: "unauthorized", message: "Authentification requise." },
        { status: 401 },
      ),
    }
  }

  return { ok: true as const, user }
}
