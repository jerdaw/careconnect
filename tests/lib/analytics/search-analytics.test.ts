import { describe, it, expect, vi, beforeEach } from "vitest"

// Hoist env vars so they are available when the module is imported
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key"
})

// import { createClient } from "@supabase/supabase-js"

// Mock Supabase
const { mockSupabaseInstance } = vi.hoisted(() => ({
  mockSupabaseInstance: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
  },
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseInstance),
}))

import { trackSearchEvent } from "@/lib/analytics/search-analytics"

describe("Search Analytics", () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = mockSupabaseInstance
    mockSupabase.insert.mockResolvedValue({ error: null })
  })

  it("buckets result counts correctly", async () => {
    // 0 results
    await trackSearchEvent({ category: "Food", resultCount: 0, hasLocation: true })
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        result_count_bucket: "0",
      })
    )

    // 1-5 results
    await trackSearchEvent({ category: "Food", resultCount: 3, hasLocation: true })
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        result_count_bucket: "1-5",
      })
    )

    // 5+ results
    await trackSearchEvent({ category: "Food", resultCount: 10, hasLocation: true })
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        result_count_bucket: "5+",
      })
    )
  })

  it("handles missing category with default", async () => {
    await trackSearchEvent({ category: null, resultCount: 5, hasLocation: false })
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "All",
      })
    )
  })

  it("handles supabase errors silently", async () => {
    mockSupabase.insert.mockResolvedValue({ error: { message: "DB Error" } })
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})

    await trackSearchEvent({ category: "Food", resultCount: 5, hasLocation: true })

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
