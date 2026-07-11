import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/v1/notifications/unsubscribe/route"
import { createMockRequest, parseResponse } from "../../../utils/api-test-utils"
import { createClient } from "@/utils/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"

// Mock Supabase
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 19, reset: 4102444800 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  createRateLimitHeaders: vi.fn().mockReturnValue({
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "4102444800",
    "Retry-After": "3600",
  }),
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
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 19, reset: 4102444800 })
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

  it("returns 400 for malformed JSON before rate limiting or database setup", async () => {
    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON" })
    expect(res.headers.get("content-type")).toContain("application/json")
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns the existing missing-endpoint response for JSON null", async () => {
    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: "null",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "Missing endpoint" })
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(createClient).not.toHaveBeenCalled()
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

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0, reset: 4102444800 })

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://test.com/123" }),
      headers: { "Content-Type": "application/json" },
    })

    const res = await POST(req)
    const { data } = await parseResponse<{ error: string }>(res)

    expect(res.status).toBe(429)
    expect(data.error).toBe("Too many requests. Please try again later.")
    expect(res.headers.get("Retry-After")).toBe("3600")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
    expect(res.headers.get("X-RateLimit-Reset")).toBe("4102444800")
  })
})
