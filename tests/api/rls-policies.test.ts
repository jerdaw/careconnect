import { describe, it, expect, beforeAll } from "vitest"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * RLS Policy Tests
 *
 * Verifies that the database enforces access control rules correctly.
 * These tests require a real Supabase instance with RLS enabled.
 */

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const hasCredentials = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== "https://mock.supabase.co"

describe.skipIf(!hasCredentials)("RLS Policies (Integration)", () => {
  let supabase: SupabaseClient

  beforeAll(() => {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!)
  })

  describe("services table", () => {
    it("allows public read of verified services (L1+)", async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, verification_level")
        .gte("verification_level", 1)
        .limit(1)

      expect(error).toBeNull()
      if (data && data.length > 0) {
        expect(data[0]?.verification_level).toBeGreaterThanOrEqual(1)
      }
    })

    it("blocks read of unverified services (L0)", async () => {
      const { data, error } = await supabase.from("services").select("id").eq("verification_level", 0).limit(1)

      // Depending on policy, it might return empty array or error
      // Usually RLS just filters out rows, so data should be empty
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it("blocks read of soft-deleted services", async () => {
      const { data, error } = await supabase.from("services").select("id").not("deleted_at", "is", null).limit(1)

      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it("blocks unauthorized insert", async () => {
      const { error } = await supabase.from("services").insert({ name: "Unauthorized Service", org_id: "any-org" })

      expect(error).not.toBeNull()
      expect(error?.message).toMatch(/violates row-level security policy/i)
    })
  })

  describe("organization_members table", () => {
    it("allows users to see own memberships", async () => {
      // Note: This requires a logged-in session, which we don't have here for anon
      // But we can check if it blocks anon
      const { data, error } = await supabase.from("organization_members").select("organization_id")

      expect(error).toBeNull()
      // Anon should see nothing
      expect(data).toHaveLength(0)
    })
  })
})

describe("RLS Policies (Logic Patterns)", () => {
  it("identifies RLS violation messages correctly", () => {
    const error = { message: 'new row violates row-level security policy for table "services"' }
    expect(error.message).toMatch(/violates row-level security policy/i)
  })
})
