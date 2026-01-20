import "../../setup/next-mocks"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/v1/feedback/route"
import { createClient } from "@/utils/supabase/server"

// No need to manually mock createClient here as next-mocks handles @supabase/ssr
// which is what createClient uses.

describe("Feedback V1 API Route", () => {
  // Use the mock from next-mocks
  const getMockSupabase = async () => {
    return await createClient()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for invalid zod schema", async () => {
    const request = new Request("http://localhost/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify({
        // Missing feedback_type
        service_id: "123",
      }),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(400)
    const json = (await response.json()) as any
    expect(json.success).toBe(false)
    expect(json.message).toBe("Invalid feedback data")
  })

  it("successfully inserts valid feedback", async () => {
    const supabase = await createClient()
    const mockFrom = vi.mocked(supabase.from)
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert } as any)

    const payload = {
      service_id: "123",
      feedback_type: "helpful_yes",
    }

    const request = new Request("http://localhost/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(200)
    const json = (await response.json()) as any
    expect(json.success).toBe(true)

    expect(mockFrom).toHaveBeenCalledWith("feedback")
    expect(mockInsert).toHaveBeenCalledWith([
      {
        feedback_type: "helpful_yes",
        message: null,
        service_id: "123",
        category_searched: null,
        status: "pending",
      },
    ])
  })

  it("successfully inserts global not_found feedback", async () => {
    const supabase = await createClient()
    const mockFrom = vi.mocked(supabase.from)
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert } as any)

    const payload = {
      feedback_type: "not_found",
      category_searched: "Food",
      message: "Need more pantries",
    }

    const request = new Request("http://localhost/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(200)

    expect(mockInsert).toHaveBeenCalledWith([
      {
        feedback_type: "not_found",
        message: "Need more pantries",
        service_id: null,
        category_searched: "Food",
        status: "pending",
      },
    ])
  })

  it("returns 500 on database error", async () => {
    const supabase = await createClient()
    const mockFrom = vi.mocked(supabase.from)
    const mockInsert = vi.fn().mockResolvedValue({ error: { message: "Supabase Error" } })
    mockFrom.mockReturnValue({ insert: mockInsert } as any)

    const request = new Request("http://localhost/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify({
        feedback_type: "helpful_no",
      }),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(500)
    const json = (await response.json()) as any
    expect(json.message).toBe("Failed to save feedback")
  })
})
