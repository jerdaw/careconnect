import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/v1/notifications/subscribe/route"
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

// Separate Builder and Client mocks to handle thenable chaining correctly
const mockBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  then: vi.fn(), // Make builder thenable for await
}

const mockSupabase = {
  from: vi.fn().mockReturnValue(mockBuilder),
}

describe("Notifications Subscribe API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 19, reset: 4102444800 })

    // Setup chaining: methods return the builder
    mockBuilder.select.mockReturnValue(mockBuilder)
    mockBuilder.eq.mockReturnValue(mockBuilder)
    mockBuilder.update.mockReturnValue(mockBuilder)
    mockBuilder.insert.mockReturnValue(mockBuilder)

    // Default 'then' behavior (success)
    mockBuilder.then.mockImplementation((resolve) => resolve({ error: null }))

    // single() returns a Promise explicitly, as it's terminal in usage here
    mockBuilder.single.mockResolvedValue({ data: null, error: null })
  })

  const validPayload = {
    subscription: { endpoint: "https://test.com/123", keys: { p256dh: "a", auth: "b" } },
    categories: ["emergency"],
    locale: "en",
  }

  it("returns 400 for invalid payload", async () => {
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

  it("returns the existing invalid-payload response for JSON null", async () => {
    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: "null",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "Invalid subscription payload" })
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(createClient).not.toHaveBeenCalled()
  })

  it("inserts new subscription if not found", async () => {
    mockBuilder.single.mockResolvedValue({ data: null, error: null })
    // Insert needs to behave as a promise resolving to null error
    mockBuilder.then.mockImplementation((resolve) => resolve({ error: null }))

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    const { data } = await parseResponse<{ success: boolean }>(res)

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: validPayload.subscription.endpoint,
      })
    )
  })

  it("updates existing subscription if found", async () => {
    mockBuilder.single.mockResolvedValue({ data: { id: "existing-id" }, error: null })
    // Update chain ends with eq(), so await eq() triggers then()
    mockBuilder.then.mockImplementation((resolve) => resolve({ error: null }))

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: validPayload.categories,
      })
    )
    expect(mockBuilder.eq).toHaveBeenCalledWith("id", "existing-id")
  })

  it("returns 500 on database error", async () => {
    mockBuilder.single.mockResolvedValue({ data: null, error: null })
    // Simulate error on insert
    mockBuilder.then.mockImplementation((resolve) => resolve({ error: { message: "DB Error" } }))

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0, reset: 4102444800 })

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(validPayload),
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
