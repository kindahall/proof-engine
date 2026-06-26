import { describe, expect, it } from "vitest"
import { SupabaseConfigError } from "@/lib/supabase/env"
import {
  isSupabaseSchemaCacheError,
  toSupabaseOperationalError,
} from "@/lib/supabase/errors"

describe("Supabase operational errors", () => {
  it("detects PostgREST schema cache errors by code and message", () => {
    expect(isSupabaseSchemaCacheError({ code: "PGRST205" })).toBe(true)
    expect(isSupabaseSchemaCacheError(new Error("Could not find the table in the schema cache"))).toBe(true)
    expect(isSupabaseSchemaCacheError(new Error("Invalid credentials"))).toBe(false)
  })

  it("maps config and schema errors to stable API payloads", () => {
    expect(toSupabaseOperationalError(new SupabaseConfigError("Missing env"))).toMatchObject({
      error: "supabase_not_configured",
      message: "Missing env",
    })
    expect(toSupabaseOperationalError({ code: "PGRST205" })).toMatchObject({
      error: "supabase_schema_not_ready",
    })
  })
})
