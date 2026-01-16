import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/v1/services/[id]/summary/route"
import { createClient } from "@/utils/supabase/server"

// Mock Supabase
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}))

describe("GET /api/v1/services/[id]/summary", () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  it("returns 400 if service ID is missing", async () => {
    const req = new Request("http://localhost/api/v1/services//summary")
    const res = await GET(req as any, { params: Promise.resolve({ id: "" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it("returns 404 if summary not found", async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } })

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
    mockSupabase.single.mockResolvedValue({ data: mockSummary, error: null })

    const req = new Request("http://localhost/api/v1/services/svc-123/summary")
    const res = await GET(req as any, { params: Promise.resolve({ id: "svc-123" }) })
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toEqual(mockSummary)
  })
})
