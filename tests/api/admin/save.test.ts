import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/admin/save/route"
import { createMockRequest, parseResponse } from "../../utils/api-test-utils"
import { assertAdminRole } from "@/lib/auth/authorization"
// createServerClient import removed

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

// Mock @supabase/ssr
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  upsert: vi.fn().mockResolvedValue({ error: null }),
  insert: vi.fn().mockResolvedValue({ error: null }),
}

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => mockQueryBuilder),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
}

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabase),
}))

// Mock authorization
vi.mock("@/lib/auth/authorization", () => ({
  assertAdminRole: vi.fn(),
}))

describe("Admin Save API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null })
    vi.mocked(assertAdminRole).mockResolvedValue(undefined as any)

    // Reset query builder mocks
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null })
    mockQueryBuilder.upsert.mockResolvedValue({ error: null })
    mockQueryBuilder.insert.mockResolvedValue({ error: null })
  })

  it("returns 401 if unauthorized", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ service: { id: "1" } }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("returns 400 for invalid data", async () => {
    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("saves service and returns 200", async () => {
    // Mock existing service for audit log "UPDATE"
    mockQueryBuilder.single.mockResolvedValue({ data: { id: "1", name: "Old" }, error: null })

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ service: { id: "1", name: "New" } }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    const { data } = await parseResponse<{ data: { success: boolean } }>(res)

    expect(res.status).toBe(200)
    expect(data.data.success).toBe(true)

    // Check Supabase calls
    expect(mockSupabase.from).toHaveBeenCalledWith("services")
    expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        name: "New",
      })
    )
    expect(mockSupabase.from).toHaveBeenCalledWith("audit_logs")
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "UPDATE",
      })
    )
  })

  it("adds new service if not found (CREATE)", async () => {
    // Mock no existing service
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } })

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ service: { id: "2", name: "Brand New" } }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)

    // Check Supabase calls
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "CREATE",
      })
    )
  })
})
