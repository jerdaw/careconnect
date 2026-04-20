/** @vitest-environment node */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

const ORIGINAL_ENV = process.env

describe("lib/supabase", () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it("reports missing credentials and throws lazily", async () => {
    const mod = await import("@/lib/supabase")

    expect(mod.hasSupabaseCredentials()).toBe(false)
    expect(() => mod.getSupabaseClient()).toThrow(mod.SupabaseNotConfiguredError)
  })

  it("creates a singleton client when credentials exist", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key"

    const mod = await import("@/lib/supabase")

    const first = mod.getSupabaseClient()
    const second = mod.getSupabaseClient()

    expect(mod.hasSupabaseCredentials()).toBe(true)
    expect(first).toBe(second)
  })
})
