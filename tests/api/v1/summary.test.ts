import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/v1/services/[id]/summary/route"
import { createServerClient } from "@supabase/ssr"

describe("GET /api/v1/services/[id]/summary", () => {
  const mockSingle = vi.fn()
  const mockFrom = vi.fn(() => ({
    select: () => ({
      eq: () => ({
        single: mockSingle,
      }),
    }),
  }))

  const mockSupabase = {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  }

  // Standard SSR mocking via next-mocks
  vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 if service ID is missing", async () => {
    const req = new Request("http://localhost/api/v1/services//summary")
    const res = await GET(req as any, { params: Promise.resolve({ id: "" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it("returns 404 if summary not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } })

    const req = new Request("http://localhost/api/v1/services/svc-123/summary")
    const res = await GET(req as any, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(404)
    expect(json.success).toBe(false)
  })

  it("returns 200 and summary data if found", async () => {
    const mockSummary = {
      service_id: "svc-123",
      summary_en: "Simple summary",
      how_to_use_en: "Call us",
    }
    mockSingle.mockResolvedValue({ data: mockSummary, error: null })

    const req = new Request("http://localhost/api/v1/services/svc-123/summary")
    const res = await GET(req as any, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toEqual(mockSummary)
  })
})
