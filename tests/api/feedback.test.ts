import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/feedback/route"
import { createClient } from "@/utils/supabase/server"

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe("Feedback API Route", () => {
  const mockInsert = vi.fn()
  const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })
  const mockSupabase = { from: mockFrom }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockResolvedValue(mockSupabase)
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
