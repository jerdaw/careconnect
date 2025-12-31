import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/v1/services/route"
import { createMockRequest, parseResponse } from "@/tests/utils/api-test-utils"

// Hoist mock chain
const { mockSupabaseChain } = vi.hoisted(() => {
    const chain = {
        from: vi.fn(),
        select: vi.fn(),
        eq: vi.fn(),
        or: vi.fn(),
        range: vi.fn(),
        insert: vi.fn(),
        single: vi.fn(),
    }
    // Setup chain return values to return itself (this)
    // BUT we can't easily reference 'chain' inside its own definition if we want to return 'chain'
    // So we define mock function that return 'chain' object.
    // Easier:
    const mockChain: Record<string, any> = {}
    mockChain.from = vi.fn(() => mockChain)
    mockChain.select = vi.fn(() => mockChain)
    mockChain.eq = vi.fn(() => mockChain)
    mockChain.or = vi.fn(() => mockChain)
    mockChain.range = vi.fn(() => Promise.resolve({ data: [], count: 0, error: null }))
    mockChain.insert = vi.fn(() => mockChain)
    mockChain.single = vi.fn(() => Promise.resolve({ data: null, error: null }))

    return { mockSupabaseChain: mockChain }
})

vi.mock("@/lib/supabase", () => ({
    supabase: mockSupabaseChain
}))

vi.mock("@/lib/rate-limit", () => ({
    checkRateLimit: vi.fn().mockReturnValue({ success: true, reset: 0 }),
    getClientIp: vi.fn().mockReturnValue("127.0.0.1")
}))

// Mock Supabase SSR
vi.mock("@supabase/ssr", () => ({
    createServerClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
        },
        from: mockSupabaseChain.from // Reuse chain logic? 
        // Or better, define strict behavior for createServerClient
        // The endpoint creates a NEW client.
    }))
}))

// We need to ensure createServerClient returns an object where .from() works.
// In the hoister above, mockSupabaseChain.from() returns mockSupabaseChain.
// So if createServerClient returns { from: mockSupabaseChain.from }, then .from() returns mockSupabaseChain...
// which has .insert(), .select(), .single().
// It seems compatible with POST logic: .from().insert().select().single()

vi.mock("next/headers", () => ({
    cookies: vi.fn().mockResolvedValue({
        getAll: vi.fn().mockReturnValue([])
    })
}))

describe("API v1 Services", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset chain defaults
        mockSupabaseChain.range.mockResolvedValue({ data: [], count: 0, error: null })
        mockSupabaseChain.single.mockResolvedValue({ data: { id: "new-1" }, error: null })
    })

    it("GET services returns 200 with data", async () => {
        const mockData = [{ id: "1", name: "Service" }]
        mockSupabaseChain.range.mockResolvedValue({ data: mockData, count: 1, error: null })

        const req = createMockRequest("http://localhost/api/v1/services?query=test")
        const res = await GET(req)
        const { status, data } = await parseResponse(res) as { status: number, data: any }

        expect(status).toBe(200)
        expect(data.data).toHaveLength(1)
        expect(data.data[0].name).toBe("Service")
        expect(mockSupabaseChain.from).toHaveBeenCalledWith("services")
    })

    it("GET validates rate limit", async () => {
        const { checkRateLimit } = await import("@/lib/rate-limit")
            ; (checkRateLimit as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({ success: false, reset: 0 })

        const req = createMockRequest("http://localhost/api/v1/services")
        const res = await GET(req)

        expect(res.status).toBe(429)
    })

    it("POST creates service when authenticated", async () => {
        const req = createMockRequest("http://localhost/api/v1/services", {
            method: "POST",
            body: JSON.stringify({ name: "New Service", category: "food" })
        })

        const res = await POST(req)
        const { status, data } = await parseResponse(res) as { status: number, data: any }

        expect(status).toBe(201)
        expect(data.data.id).toBe("new-1")
    })
})
