import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/v1/notifications/unsubscribe/route"
import { createMockRequest, parseResponse } from "../../../utils/api-test-utils"
import { createClient } from "@/utils/supabase/server"

// Mock Supabase
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}))

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
}

describe("Notifications Unsubscribe API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it("returns 400 for missing endpoint", async () => {
    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("deletes subscription and returns 200", async () => {
    mockSupabase.eq.mockResolvedValue({ error: null })

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://test.com/123" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    const { data } = await parseResponse<{ success: boolean }>(res)

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith("push_subscriptions")
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith("endpoint", "https://test.com/123")
  })

  it("returns 500 on database error", async () => {
    mockSupabase.eq.mockResolvedValue({ error: { message: "DB Error" } })

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://test.com/123" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
