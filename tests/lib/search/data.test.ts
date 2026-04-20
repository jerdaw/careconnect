import { describe, it, expect, vi, beforeEach } from "vitest"
import { loadServices, resetServiceDataCache } from "@/lib/search/data"
import { supabase } from "@/lib/supabase"

// Mock dependencies
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  },
}))

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://mock.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "mock-key",
  },
}))

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: vi.fn((operation: () => Promise<unknown>) => operation()),
  isSupabaseAvailable: vi.fn(() => true),
}))

// Mock dynamic imports for data
vi.mock("@/data/services.json", () => ({
  default: [
    { id: "1", name: "Service 1", synthetic_queries: ["query 1"] },
    { id: "2", name: "Service 2" },
  ],
}))

vi.mock("@/data/embeddings.json", () => ({
  default: {
    "1": [0.1, 0.2],
    "2": [0.3, 0.4],
  },
}))

describe("Search Data Loading", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetServiceDataCache()
  })

  it("loads services directly from Supabase without JSON overlay metadata", async () => {
    const mockData = [{ id: "1", name: "Service 1 (DB)", verification_status: 3 }]
    ;(supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })

    const services = await loadServices()

    expect(services).toHaveLength(1)
    expect(services[0]!.name).toBe("Service 1 (DB)")
    expect(services[0]!.synthetic_queries).toEqual([])
    expect(services[0]!.embedding).toBeUndefined()
  })

  it("falls back to local JSON on Supabase error", async () => {
    ;(supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } }),
    })

    const services = await loadServices()

    expect(services.length).toBeGreaterThan(0)
    expect(services.some((s) => s.id === "1")).toBe(true)
    expect(services.find((s) => s.id === "1")?.synthetic_queries).toEqual(["query 1"])
    expect(services.find((s) => s.id === "1")?.embedding).toEqual([0.1, 0.2])
  })

  it("filters out soft-deleted services from DB", async () => {
    const mockData = [
      { id: "1", name: "Active", deleted_at: null },
      { id: "2", name: "Deleted", deleted_at: "2023-01-01" },
    ]
    ;(supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })

    const services = await loadServices()

    expect(services).toHaveLength(1)
    expect(services[0]?.id).toBe("1")
  })
})
