import "../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/feedback/route"
import { createServerClient } from "@supabase/ssr"

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

describe("Feedback API Route", () => {
  const mockInsert = vi.fn()
  const mockFrom = vi.fn()
  const mockSupabase = {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
  }

  // Standard SSR mocking via next-mocks
  vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ insert: mockInsert })
  })

  it("returns 400 for invalid input", async () => {
    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({ serviceId: "" }), // Missing fields
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = (await response.json()) as any
    expect(json.error).toBe("Invalid input")
  })

  it("successfully inserts feedback", async () => {
    mockInsert.mockResolvedValue({ error: null })

    const feedbackData = {
      serviceId: "123",
      feedbackType: "wrong_phone",
      message: "New number is 555-0199",
    }

    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify(feedbackData),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const json = (await response.json()) as any
    expect(json.success).toBe(true)

    expect(mockFrom).toHaveBeenCalledWith("feedback")
    expect(mockInsert).toHaveBeenCalledWith({
      service_id: "123",
      feedback_type: "wrong_phone",
      message: "New number is 555-0199",
    })
  })

  it("returns 500 on database error", async () => {
    mockInsert.mockResolvedValue({ error: { message: "DB Error" } })

    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "123",
        feedbackType: "other",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const json = (await response.json()) as any
    expect(json.error).toBe("DB Error")
  })
})
