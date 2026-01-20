import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/admin/save/route"
import { createMockRequest, parseResponse } from "../../utils/api-test-utils"
import fs from "fs/promises"
import { assertAdminRole } from "@/lib/auth/authorization"

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

// Mock @supabase/ssr
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
}
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabase),
}))

// Mock authorization
vi.mock("@/lib/auth/authorization", () => ({
  assertAdminRole: vi.fn(),
}))

// Mock fs/promises
vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}))

describe("Admin Save API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null })
    vi.mocked(assertAdminRole).mockResolvedValue(undefined as any)
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
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([{ id: "1", name: "Old" }]))
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ service: { id: "1", name: "New" } }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    const { data } = await parseResponse<{ data: { success: boolean } }>(res)

    expect(res.status).toBe(200)
    expect(data.data.success).toBe(true)
    expect(fs.writeFile).toHaveBeenCalled()
    expect(mockSupabase.from).toHaveBeenCalledWith("audit_logs")
  })

  it("adds new service if not found", async () => {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([]))
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    const req = createMockRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ service: { id: "2", name: "Brand New" } }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(fs.writeFile).toHaveBeenCalled()
    // Verify it added to empty array
    const writtenBody = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0]![1] as string) as any[]
    expect(writtenBody).toHaveLength(1)
    expect(writtenBody[0].id).toBe("2")
  })
})
