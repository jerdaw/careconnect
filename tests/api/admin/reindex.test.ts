import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/admin/reindex/route"
import { createMockRequest, parseResponse } from "../../utils/api-test-utils"
import { exec } from "child_process"
import { assertAdminRole } from "@/lib/auth/authorization"

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

// Mock @supabase/ssr
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  is: vi.fn().mockResolvedValue({ count: 100, error: null }),
  insert: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: "progress-123" }, error: null }),
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

// Mock child_process
const { mockExec } = vi.hoisted(() => ({
  mockExec: vi.fn((cmd: string, cb: any) => cb(null, { stdout: "done", stderr: "" })),
}))
vi.mock("child_process", () => ({
  exec: mockExec,
  default: { exec: mockExec },
}))

describe("Admin Reindex API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null })
    vi.mocked(assertAdminRole).mockResolvedValue(undefined as any)

    // Reset query builder mocks
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.is.mockResolvedValue({ count: 100, error: null })
    mockQueryBuilder.insert.mockReturnThis()
    mockQueryBuilder.single.mockResolvedValue({ data: { id: "progress-123" }, error: null })
  })

  it("calls reindex command and returns 200", async () => {
    const res = await POST()
    const { data } = await parseResponse<{ data: { success: boolean } }>(res)

    expect(res.status).toBe(200)
    expect(data.data.success).toBe(true)
    expect(mockExec).toHaveBeenCalledWith("npm run generate-embeddings", expect.any(Function))
    expect(mockSupabase.from).toHaveBeenCalledWith("audit_logs")
  })

  it("starts reindex even if exec will fail (background processing)", async () => {
    mockExec.mockImplementation(((cmd: string, cb: any) => {
      cb(new Error("Failed"), null)
    }) as any)

    // Reindexing happens in background, so POST still returns 200 with progress ID
    const res = await POST()
    const { data } = await parseResponse<{ data: { success: boolean; progressId: string } }>(res)

    expect(res.status).toBe(200)
    expect(data.data.success).toBe(true)
    expect(data.data.progressId).toBe("progress-123")
    // The actual failure is logged to the progress record asynchronously
  })
})
