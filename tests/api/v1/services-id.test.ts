import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, PUT } from "@/app/api/v1/services/[id]/route"
import { createMockRequest, parseResponse } from "@/tests/utils/api-test-utils"

// --- Mock Setup for Chaining Supabase Calls ---

// 1. Common chain mocks
const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
}
// Add recursive 'from' return logic if needed, but mockReturnThis covers basic chaining
// mockChain.from = vi.fn().mockReturnValue(mockChain)

// 2. Mock 'lib/supabase' (Public Client)
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from "@/lib/supabase"

// 3. Mock '@supabase/ssr' (Authenticated Client)
const mockAuthGetUser = vi.fn()
const mockSSRFrom = vi.fn()

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockAuthGetUser,
    },
    from: mockSSRFrom,
  })),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

describe("API v1 Services [id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Link mocks to the chain
    vi.mocked(supabase.from).mockReturnValue(mockChain as any)
    mockSSRFrom.mockReturnValue(mockChain as any)

    // Default "Success" Setup
    mockChain.single.mockResolvedValue({ data: { id: "123", name: "Test Service" }, error: null })
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
  })

  describe("GET (Public)", () => {
    it("returns 400 if ID is missing (should not happen with generic params but good logical check)", async () => {
      // We pass empty params object?
      // In Next.js route, params.id comes from the URL.
      // If we test the function directly:
      const req = createMockRequest("http://localhost/api/v1/services/")
      const res = await GET(req, { params: Promise.resolve({ id: "" }) })
      expect(res.status).toBe(400)
    })

    it("returns 404 if service not found", async () => {
      mockChain.single.mockResolvedValue({ data: null, error: { message: "Not found" } })

      const req = createMockRequest("http://localhost/api/v1/services/999")
      const res = await GET(req, { params: Promise.resolve({ id: "999" }) })

      expect(res.status).toBe(404)
    })

    it("returns 200 and service data if found", async () => {
      const req = createMockRequest("http://localhost/api/v1/services/123")
      const res = await GET(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(200)
      const { data: body } = await parseResponse<{ data: { id: string } }>(res)
      expect(body.data).toHaveProperty("id", "123")
    })
  })

  describe("PUT (Protected)", () => {
    it("returns 401 if not authenticated", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: "Unauth" })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(401)
    })

    it("updates service and returns 200", async () => {
      // Mock Update response
      mockChain.single.mockResolvedValue({ data: { id: "123", name: "Updated" }, error: null })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(200)
      const { data: body } = await parseResponse<{ data: { name: string } }>(res)
      expect(body.data.name).toBe("Updated")

      // const updateCall = mockChain.update.mock.calls[0]
      // expect(updateCall[0]).not.toHaveProperty("id")
    })

    it("returns 500 if database update fails", async () => {
      // Mock error response
      mockChain.single.mockResolvedValue({ data: null, error: { message: "DB Error" } })

      const req = createMockRequest("http://localhost/api/v1/services/123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: "123" }) })

      expect(res.status).toBe(500)
    })
  })
})
