import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/v1/services/route"
import { createMockRequest, parseResponse } from "@/tests/utils/api-test-utils"
import { createServerClient } from "@supabase/ssr"

// Hoist mock chain
const { mockSupabaseChain } = vi.hoisted(() => {
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
  supabase: mockSupabaseChain,
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, reset: 0 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}))

// Standard SSR mocking via next-mocks
vi.mocked(createServerClient).mockReturnValue({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
  },
  from: mockSupabaseChain.from,
} as any)

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
    const { status, data } = (await parseResponse(res)) as { status: number; data: any }

    expect(status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].name).toBe("Service")
    expect(mockSupabaseChain.from).toHaveBeenCalledWith("services")
  })

  it("GET validates rate limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit")
    ;(checkRateLimit as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      success: false,
      reset: 0,
    })

    const req = createMockRequest("http://localhost/api/v1/services")
    const res = await GET(req)

    expect(res.status).toBe(429)
  })

  it("POST creates service when authenticated", async () => {
    const req = createMockRequest("http://localhost/api/v1/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Service",
        intent_category: "Food",
        description: "This is a valid service description.",
        url: "https://example.com",
      }),
    })

    const res = await POST(req)
    const { status, data } = await parseResponse<{ data: { id: string } }>(res)

    expect(status).toBe(201)
    expect(data.data.id).toBe("new-1")
  })
})
