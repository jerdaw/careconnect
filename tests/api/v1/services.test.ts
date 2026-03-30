import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/v1/services/route"
import { createMockRequest, parseResponse } from "@/tests/utils/api-test-utils"
import { createServerClient } from "@supabase/ssr"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"

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
  unsafeFrom: vi.fn((_client: unknown, _table: string) => mockSupabaseChain),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, reset: 0 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}))

vi.mock("@/lib/logger", () => ({
  generateErrorId: vi.fn().mockReturnValue("test-request-id"),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Standard SSR mocking via next-mocks
function createAuthClient(options?: {
  user?: { id: string } | null
  membershipOrgId?: string | null
  role?: string
  insertResult?: { data: { id: string } | null; error: { message: string } | null }
}) {
  const membershipOrgId =
    options && "membershipOrgId" in options ? options.membershipOrgId : "11111111-1111-4111-8111-111111111111"
  const role = options?.role ?? "editor"
  const insertResult = options?.insertResult ?? { data: { id: "new-1" }, error: null }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: options?.user ?? { id: "user-1" } }, error: null }),
    },
    from: vi.fn((table: string) => {
      if (table === "organization_members") {
        const membershipQuery = {
          select: vi.fn(() => membershipQuery),
          eq: vi.fn(() => membershipQuery),
          single: vi.fn().mockResolvedValue({
            data: membershipOrgId ? { organization_id: membershipOrgId, role } : null,
            error: membershipOrgId ? null : { message: "No membership" },
          }),
        }

        return {
          select: vi.fn(() => membershipQuery),
        }
      }

      if (table === "services") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(insertResult),
            }),
          }),
        }
      }

      return mockSupabaseChain
    }),
  }
}

vi.mocked(createServerClient).mockReturnValue(createAuthClient() as any)

describe("API v1 Services", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset chain defaults
    mockSupabaseChain.range.mockResolvedValue({ data: [], count: 0, error: null })
    mockSupabaseChain.single.mockResolvedValue({ data: { id: "new-1" }, error: null })
    vi.mocked(checkRateLimit).mockReturnValue({ success: true, reset: 0 } as any)
    vi.mocked(createServerClient).mockReturnValue(createAuthClient() as any)
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

  it("GET does not log raw search query values on database failures", async () => {
    mockSupabaseChain.range.mockResolvedValue({
      data: null,
      count: 0,
      error: { message: "Database unavailable" },
    })

    const req = createMockRequest("http://localhost/api/v1/services?q=sensitive search")
    const res = await GET(req)

    expect(res.status).toBe(500)
    expect(logger.error).toHaveBeenCalledWith(
      "API /v1/services error:",
      "Database unavailable",
      expect.not.objectContaining({ query: "sensitive search" })
    )
  })

  it("POST creates service for the authenticated member organization", async () => {
    const req = createMockRequest("http://localhost/api/v1/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Service",
        intent_category: "Food",
        description: "This is a valid service description.",
        url: "https://example.com",
        org_id: "11111111-1111-4111-8111-111111111111",
      }),
    })

    const res = await POST(req)
    const { status, data } = await parseResponse<{ data: { id: string } }>(res)

    expect(status).toBe(201)
    expect(data.data.id).toBe("new-1")
  })

  it("POST rejects users without organization membership", async () => {
    vi.mocked(createServerClient).mockReturnValue(createAuthClient({ membershipOrgId: null }) as any)

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
    const { status, data } = await parseResponse<{
      error: { message: string }
    }>(res)

    expect(status).toBe(403)
    expect(data.error.message).toContain("not a member")
  })

  it("POST rejects mismatched organization IDs", async () => {
    vi.mocked(createServerClient).mockReturnValue(
      createAuthClient({ membershipOrgId: "11111111-1111-4111-8111-111111111111" }) as any
    )

    const req = createMockRequest("http://localhost/api/v1/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Service",
        intent_category: "Food",
        description: "This is a valid service description.",
        url: "https://example.com",
        org_id: "22222222-2222-4222-8222-222222222222",
      }),
    })

    const res = await POST(req)
    const { status, data } = await parseResponse<{
      error: { message: string }
    }>(res)

    expect(status).toBe(403)
    expect(data.error.message).toContain("another organization")
  })

  it("POST rejects members without create permission", async () => {
    vi.mocked(createServerClient).mockReturnValue(createAuthClient({ role: "viewer" }) as any)

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
    const { status, data } = await parseResponse<{
      error: { message: string }
    }>(res)

    expect(status).toBe(403)
    expect(data.error.message).toContain("canCreateServices")
  })
})
