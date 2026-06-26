import { createSupabaseAdminClient } from "@/lib/supabase/server"

export async function upsertUserProfile(input: {
  userId: string
  fullName: string
}) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from("profiles").upsert({
    id: input.userId,
    full_name: input.fullName,
    updated_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
}
