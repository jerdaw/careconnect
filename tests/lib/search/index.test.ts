import { describe, it, expect, vi, beforeEach } from "vitest"
import { searchServices } from "@/lib/search/index"

// Mock dependencies
vi.mock("@/lib/supabase", () => ({
    supabase: {
        rpc: vi.fn(),
        from: vi.fn() // Add 'from' just in case
    }
}))

vi.mock("@/lib/ai/vector-cache", () => ({
    vectorCache: {
        get: vi.fn(),
        set: vi.fn()
    }
}))

vi.mock("@/lib/ai/engine", () => ({
    aiEngine: {
        isReady: false,
        chat: vi.fn()
    }
}))

// Mock data loading
vi.mock("@/lib/search/data", () => ({
    loadServices: vi.fn().mockResolvedValue([
        { id: "1", name: "Test Service", description: "A test service", intent_category: "food" }
    ])
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
})
