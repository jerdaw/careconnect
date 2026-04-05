import { describe, it, expect, vi, beforeEach } from "vitest"
import { searchServices } from "@/lib/search/index"
import { loadServices } from "@/lib/search/data"

// Mock dependencies
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(), // Add 'from' just in case
  },
}))

vi.mock("@/lib/ai/vector-cache", () => ({
  vectorCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock("@/lib/ai/engine", () => ({
  aiEngine: {
    isReady: false,
    chat: vi.fn(),
  },
}))

// Mock data loading
vi.mock("@/lib/search/data", () => ({
  loadServices: vi
    .fn()
    .mockResolvedValue([{ id: "1", name: "Test Service", description: "A test service", intent_category: "food" }]),
}))

describe("searchServices Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns empty results for empty query if filters empty", async () => {
    const results = await searchServices("") // Fix arg
    expect(results).toEqual([])
  })

  it("falls back to keyword search if AI not ready", async () => {
    // Mock supabase RPC for keyword search if mocked scoreServiceKeyword is not used?
    // Wait, searchServices uses scoreServiceKeyword (local TS function).
    // It does NOT use supabase RPC for keyword search unless logic changed?
    // Code view of lib/search/index.ts Step 460:
    // Line 93: for (const service of filteredServices) ... scoreServiceKeyword(...)
    // So strict keyword search is local!

    // Line 110: if (!options.vectorOverride) { ... return results }
    // So it returns local keyword results.

    // Wait, where is `supabase.rpc` used?
    // It is NOT used in `searchServices` main flow in Step 460 code!

    // Wait, maybe I misread.
    // Step 460 code:
    // loadServices() -> fetches all services?
    // scoreServiceKeyword -> local scoring.

    // So my previous assumption that it calls 'search_services' RPC was based on OLD code or assumption.
    // It seems `index.ts` does pure local filtering/scoring on loaded services.

    const results = await searchServices("test")
    // Should find "Test Service" via keyword match
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.service?.name).toBe("Test Service")
  })

  it("handles no results", async () => {
    const results = await searchServices("xyz")
    expect(results).toEqual([])
  })

  it("filters by category", async () => {
    const mockServices = [
      { id: "1", name: "Food Bank", description: "Provides food", intent_category: "food", verification_level: 1 },
      { id: "2", name: "Shelter", description: "Provides housing", intent_category: "housing", verification_level: 1 },
    ]
    ;(loadServices as any).mockResolvedValue(mockServices)

    const results = await searchServices("", { category: "food" })
    expect(results).toHaveLength(1)
    expect(results[0]!.service.name).toBe("Food Bank")
  })

  it("detects crisis and boosts results", async () => {
    const mockServices = [
      { id: "1", name: "General Service", description: "General", verification_level: 1, intent_category: "food" },
      {
        id: "2",
        name: "Crisis Hotline",
        description: "Crisis",
        verification_level: 1,
        identity_tags: [{ tag: "suicide" }],
        intent_category: "Crisis",
      },
    ]
    ;(loadServices as any).mockResolvedValue(mockServices)

    const results = await searchServices("suicide")

    // Crisis results should be boosted to the top
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]!.service.name).toBe("Crisis Hotline")
  })

  it("performs vector search when vectorOverride is provided", async () => {
    const mockServices = [
      { id: "1", name: "Service 1", description: "Service 1 desc", embedding: [0.1, 0.9], verification_level: 1 },
    ]
    ;(loadServices as any).mockResolvedValue(mockServices)

    const results = await searchServices("query", {
      vectorOverride: [0.1, 0.9],
    })

    expect(results.length).toBeGreaterThan(0)
    expect(results[0]!.matchReasons.some((r) => r.includes("Semantic"))).toBe(true)
  })

  it("returns results sorted by distance if location provided", async () => {
    const mockServices = [
      {
        id: "1",
        name: "Far",
        description: "Far desc",
        coordinates: { lat: 45, lng: -77 },
        verification_level: 1,
        intent_category: "food",
      },
      {
        id: "2",
        name: "Near",
        description: "Near desc",
        coordinates: { lat: 44.23, lng: -76.48 },
        verification_level: 1,
        intent_category: "food",
      },
    ]
    ;(loadServices as any).mockResolvedValue(mockServices)

    const results = await searchServices("Near", {
      location: { lat: 44.23, lng: -76.48 },
    })

    expect(results[0]!.service.name).toBe("Near")
  })

  it("hides services beyond the governance freshness window from search results", async () => {
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 200)

    const mockServices = [
      {
        id: "1",
        name: "Expired Service",
        description: "Old record",
        last_verified: expiredDate.toISOString(),
        verification_level: 1,
        intent_category: "food",
      },
      {
        id: "2",
        name: "Fresh Service",
        description: "Current record",
        last_verified: new Date().toISOString(),
        verification_level: 1,
        intent_category: "food",
      },
    ]
    ;(loadServices as any).mockResolvedValue(mockServices)

    const results = await searchServices("service")

    expect(results.map((result) => result.service.name)).toEqual(["Fresh Service"])
  })
})
