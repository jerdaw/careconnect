import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/v1/submissions/route"
import { createClient } from "@/utils/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 9, reset: 4102444800 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  createRateLimitHeaders: vi.fn().mockReturnValue({
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "4102444800",
    "Retry-After": "3600",
  }),
}))

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: vi.fn((fn) => fn()),
}))

describe("Submissions V1 API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 9, reset: 4102444800 })
  })

  it("successfully inserts a valid service suggestion", async () => {
    const supabase = await createClient()
    const mockFrom = vi.mocked(supabase.from)
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert } as any)

    const request = new Request("http://localhost/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify({
        name: "Kingston Youth Shelter",
        description: "Emergency shelter and support services for youth in Kingston.",
        phone: "613-555-0101",
        url: "https://example.org",
        address: "123 Example St, Kingston",
        submitted_by_email: "reviewer@example.org",
      }),
    })

    const response = await POST(request as any)
    const json = (await response.json()) as any

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.message).toBe("Submission received")
    expect(mockFrom).toHaveBeenCalledWith("service_submissions")
    expect(mockInsert).toHaveBeenCalledWith([
      {
        name: "Kingston Youth Shelter",
        description: "Emergency shelter and support services for youth in Kingston.",
        phone: "613-555-0101",
        url: "https://example.org",
        address: "123 Example St, Kingston",
        submitted_by_email: "reviewer@example.org",
        status: "pending",
      },
    ])
  })

  it("normalizes optional empty strings to null before insert", async () => {
    const supabase = await createClient()
    const mockFrom = vi.mocked(supabase.from)
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert } as any)

    const request = new Request("http://localhost/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify({
        name: "Food Help",
        description: "A suggested food support service for review.",
        phone: "",
        url: "",
        address: "",
        submitted_by_email: "",
      }),
    })

    const response = await POST(request as any)

    expect(response.status).toBe(200)
    expect(mockInsert).toHaveBeenCalledWith([
      {
        name: "Food Help",
        description: "A suggested food support service for review.",
        phone: null,
        url: null,
        address: null,
        submitted_by_email: null,
        status: "pending",
      },
    ])
  })

  it.each([
    { name: "ab", description: "A valid description", url: "https://example.org" },
    { name: "Valid Service", description: "short", url: "https://example.org" },
    { name: "Valid Service", description: "A valid description", url: "not-a-url" },
    {
      name: "Valid Service",
      description: "A valid description",
      url: "https://example.org",
      submitted_by_email: "not-an-email",
    },
  ])("returns 400 for invalid submission data %#", async (payload) => {
    const request = new Request("http://localhost/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    const response = await POST(request as any)
    const json = (await response.json()) as any

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.message).toBe("Invalid submission data")
  })

  it("returns 500 on database insert error", async () => {
    const supabase = await createClient()
    const mockFrom = vi.mocked(supabase.from)
    const mockInsert = vi.fn().mockResolvedValue({ error: { message: "Supabase Error" } })
    mockFrom.mockReturnValue({ insert: mockInsert } as any)

    const request = new Request("http://localhost/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify({
        name: "Valid Service",
        description: "A valid service suggestion for review.",
      }),
    })

    const response = await POST(request as any)
    const json = (await response.json()) as any

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.message).toBe("Failed to save submission")
  })

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0, reset: 4102444800 })

    const request = new Request("http://localhost/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify({
        name: "Valid Service",
        description: "A valid service suggestion for review.",
      }),
    })

    const response = await POST(request as any)
    const json = (await response.json()) as any

    expect(response.status).toBe(429)
    expect(json.success).toBe(false)
    expect(json.message).toBe("Too many requests. Please try again later.")
    expect(response.headers.get("Retry-After")).toBe("3600")
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0")
    expect(response.headers.get("X-RateLimit-Reset")).toBe("4102444800")
  })
})
