import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/v1/notifications/subscribe/route"
import { createMockRequest, parseResponse } from "../../../utils/api-test-utils"
import { createClient } from "@/utils/supabase/server"

// Mock Supabase
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
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
})
