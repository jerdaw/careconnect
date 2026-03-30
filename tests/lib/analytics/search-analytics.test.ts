import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockInsert, mockFrom, mockWarn, mockGetSupabaseClient } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockFrom: vi.fn(),
  mockWarn: vi.fn(),
  mockGetSupabaseClient: vi.fn(),
}))

mockFrom.mockReturnValue({ insert: mockInsert })
mockGetSupabaseClient.mockReturnValue({ from: mockFrom })

vi.mock("@/lib/supabase", () => {
  class MockSupabaseNotConfiguredError extends Error {
    constructor() {
      super("Supabase credentials not configured")
      this.name = "SupabaseNotConfiguredError"
    }
  }

  return {
    getSupabaseClient: mockGetSupabaseClient,
    SupabaseNotConfiguredError: MockSupabaseNotConfiguredError,
  }
})

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mockWarn,
  },
}))

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: async <T>(operation: () => Promise<T>) => operation(),
}))

import { trackSearchEvent } from "@/lib/analytics/search-analytics"

describe("Search Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })
    mockGetSupabaseClient.mockReturnValue({ from: mockFrom })
  })

  it("stores only aggregate counts and never raw query text", async () => {
    await trackSearchEvent({ category: "Food", resultCount: 10, hasLocation: true })
    expect(mockFrom).toHaveBeenCalledWith("search_analytics")
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        query: null,
        results_count: 10,
      })
    )
  })

  it("handles supabase errors silently", async () => {
    mockInsert.mockResolvedValue({ error: { message: "DB Error" } })

    await trackSearchEvent({ category: "Food", resultCount: 5, hasLocation: true })

    expect(mockWarn).toHaveBeenCalled()
  })
})
