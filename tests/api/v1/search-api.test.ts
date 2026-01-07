
import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/v1/search/services/route"
import { createMockRequest, parseResponse } from "@/tests/utils/api-test-utils"

// Mock dependencies
const { mockSupabaseChain } = vi.hoisted(() => {
    const chain: Record<string, any> = {}
    chain.from = vi.fn(() => chain)
    chain.select = vi.fn(() => chain)
    chain.eq = vi.fn(() => chain)
    chain.or = vi.fn(() => chain)
    chain.order = vi.fn(() => chain) // Added order mock
    chain.range = vi.fn(() => Promise.resolve({ data: [], count: 0, error: null }))
    return { mockSupabaseChain: chain }
})

vi.mock("@/lib/supabase", () => ({
    supabase: mockSupabaseChain
}))

vi.mock("@/lib/rate-limit", () => ({
    checkRateLimit: vi.fn().mockReturnValue({ success: true, reset: 0 }),
    getClientIp: vi.fn().mockReturnValue("127.0.0.1")
}))

// Mock crisis detection
vi.mock("@/lib/search/crisis", () => ({
    detectCrisis: vi.fn((q) => q.includes("crisis")),
}))

describe("POST /api/v1/search/services", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default success response
        mockSupabaseChain.range.mockResolvedValue({ 
            data: [{ id: "1", name: "Service A", category: "Food" }], 
            count: 1, 
            error: null 
        })
    })

    it("returns 400 for missing locale", async () => {
        const req = createMockRequest("http://localhost/api/v1/search/services", {
            method: "POST",
            body: JSON.stringify({ query: "food" }) // Missing locale
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it("returns 200 with data for valid request", async () => {
        const req = createMockRequest("http://localhost/api/v1/search/services", {
            method: "POST",
            body: JSON.stringify({ query: "food", locale: "en" })
        })
        const res = await POST(req)
        const { status, data } = await parseResponse(res)
        
        expect(status).toBe(200)
        expect(data.data[0].name).toBe("Service A")
        expect(mockSupabaseChain.from).toHaveBeenCalledWith("services_public")
    })

    it("applies category filter", async () => {
        const req = createMockRequest("http://localhost/api/v1/search/services", {
            method: "POST",
            body: JSON.stringify({ 
                locale: "en", 
                filters: { category: "Food" } 
            })
        })
        await POST(req)
        expect(mockSupabaseChain.eq).toHaveBeenCalledWith("category", "Food")
    })

    it("sets Cache-Control: no-store when query is present", async () => {
        const req = createMockRequest("http://localhost/api/v1/search/services", {
            method: "POST",
            body: JSON.stringify({ query: "food", locale: "en" })
        })
        const res = await POST(req)
        expect(res.headers.get("Cache-Control")).toBe("no-store")
    })

    it("sets Cache-Control: public for browsing (no query)", async () => {
        const req = createMockRequest("http://localhost/api/v1/search/services", {
            method: "POST",
            body: JSON.stringify({ locale: "en" })
        })
        const res = await POST(req)
        expect(res.headers.get("Cache-Control")).toContain("public")
    })

    it("boosts crisis services when crisis detected", async () => {
        // Setup data with crisis and non-crisis items
        const mockData = [
            { id: "1", name: "Normal Service", category: "Food" },
            { id: "2", name: "Crisis Service", category: "Crisis" }
        ]
        mockSupabaseChain.range.mockResolvedValue({ data: mockData, count: 2, error: null })

        const req = createMockRequest("http://localhost/api/v1/search/services", {
            method: "POST",
            body: JSON.stringify({ query: "crisis help", locale: "en" })
        })
        
        const res = await POST(req)
        const { data } = await parseResponse(res)
        
        // Crisis service should be first
        expect(data.data[0].category).toBe("Crisis")
        expect(data.data[1].category).toBe("Food")
    })
})
