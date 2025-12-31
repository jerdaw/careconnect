import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/v1/analytics/route"
import { createMockRequest, parseResponse } from "@/tests/utils/api-test-utils"

// Use a recursive proxy or a self-referencing object to simulate infinite chaining
const mockBuilder: Record<string, unknown> = {
    then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }) // Default promise-like behavior
}
// Add methods
mockBuilder.from = vi.fn().mockReturnValue(mockBuilder)
mockBuilder.select = vi.fn().mockReturnValue(mockBuilder)
mockBuilder.gte = vi.fn().mockReturnValue(mockBuilder)
mockBuilder.eq = vi.fn().mockReturnValue(mockBuilder)

// We need to be able to change the Resolved Value.
let mockData = { data: [] as unknown[], error: null as unknown }
mockBuilder.then = (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
    return Promise.resolve(mockData).then(resolve, reject)
}

// Supabase mock
const { mockSupabaseChain } = vi.hoisted(() => {
    return { mockSupabaseChain: {} as Record<string, any> }
})


Object.assign(mockSupabaseChain, mockBuilder)


const mockAuthGetValue = { data: { user: { id: "user-1" } }, error: null }
const mockGetUser = vi.fn()

// Mock Supabase SSR
vi.mock("@supabase/ssr", () => ({
    createServerClient: vi.fn(() => ({
        auth: {
            getUser: mockGetUser
        },
        from: mockSupabaseChain.from
    }))
}))

vi.mock("next/headers", () => ({
    cookies: vi.fn().mockResolvedValue({
        getAll: vi.fn().mockReturnValue([])
    })
}))

describe("API v1 Analytics", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUser.mockResolvedValue(mockAuthGetValue)
        mockData = { data: [], error: null } // Reset data

        // Ensure methods return the builder (chainable)
        mockSupabaseChain.from.mockReturnValue(mockSupabaseChain)
        mockSupabaseChain.select.mockReturnValue(mockSupabaseChain)
        mockSupabaseChain.gte.mockReturnValue(mockSupabaseChain)
        mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain)
    })

    const setMockData = (data: any[], error: any = null) => {
        mockData = { data, error }
    }

    it("returns 401 if not authenticated", async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: "Unauth" })

        const req = createMockRequest("http://localhost/api/v1/analytics")
        const res = await GET(req)

        expect(res.status).toBe(401)
    })

    it("returns aggregated data", async () => {
        const mockEvents = [
            { service_id: "s1", event_type: "view_detail", created_at: "2023-01-01" },
            { service_id: "s1", event_type: "click_website", created_at: "2023-01-01" },
            { service_id: "s2", event_type: "view_detail", created_at: "2023-01-01" }
        ]

        setMockData(mockEvents)

        const req = createMockRequest("http://localhost/api/v1/analytics?days=30")
        const res = await GET(req)
        const { status, data: responseBody } = await parseResponse(res)
        expect(status).toBe(200)
        const typedData = responseBody as { data: { service_id: string; views: number; clicks: number }[] }
        const s1 = typedData.data.find((d) => d.service_id === "s1")
        if (!s1) throw new Error("s1 not found")
        expect(s1.views).toBe(1)
        expect(s1.clicks).toBe(1)
    })

    it("filters by service_id", async () => {
        setMockData([])
        const req = createMockRequest("http://localhost/api/v1/analytics?service_id=s1")
        await GET(req)

        expect(mockSupabaseChain.eq).toHaveBeenCalledWith("service_id", "s1")
    })
})
