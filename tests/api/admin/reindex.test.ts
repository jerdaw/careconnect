import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/admin/reindex/route"
import { parseResponse } from "../../utils/api-test-utils"
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
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
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
  mockExec: vi.fn((cmd: string, optionsOrCallback: any, callback?: any) => {
    const cb = typeof optionsOrCallback === "function" ? optionsOrCallback : callback
    cb(null, { stdout: "done", stderr: "" })
  }),
}))
vi.mock("child_process", () => ({
  exec: mockExec,
  default: { exec: mockExec },
}))

describe("Admin Reindex API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const guard = (globalThis as any).__careconnectReindexGuard
    if (guard) {
      guard.inFlight = false
      guard.lastStartedAt = 0
    }
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null })
    vi.mocked(assertAdminRole).mockResolvedValue(undefined as any)

    // Reset query builder mocks
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.order.mockReturnThis()
    mockQueryBuilder.limit.mockResolvedValue({ data: [], error: null })
    mockQueryBuilder.is.mockResolvedValue({ count: 100, error: null })
    mockQueryBuilder.insert.mockReturnThis()
    mockQueryBuilder.single.mockResolvedValue({ data: { id: "progress-123" }, error: null })
  })

  it("calls reindex command and returns 200", async () => {
    const res = await POST()
    const { data } = await parseResponse<{ data: { success: boolean } }>(res)

    expect(res.status).toBe(200)
    expect(data.data.success).toBe(true)
    expect(mockExec).toHaveBeenCalledWith(
      "npm run generate-embeddings",
      expect.objectContaining({
        timeout: expect.any(Number),
        windowsHide: true,
      }),
      expect.any(Function)
    )
    expect(mockSupabase.from).toHaveBeenCalledWith("audit_logs")
  })

  it("starts reindex even if exec will fail (background processing)", async () => {
    mockExec.mockImplementation(((cmd: string, optionsOrCallback: any, callback?: any) => {
      const cb = typeof optionsOrCallback === "function" ? optionsOrCallback : callback
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

  it("rejects when a database reindex job is already running", async () => {
    mockQueryBuilder.limit.mockResolvedValueOnce({
      data: [{ id: "progress-active", started_at: "2026-01-01T00:00:00Z", status: "running" }],
      error: null,
    })

    const res = await POST()
    const { data } = await parseResponse<{ error: { message: string; details: { progressId: string } } }>(res)

    expect(res.status).toBe(409)
    expect(data.error.message).toBe("A reindex job is already running")
    expect(data.error.details.progressId).toBe("progress-active")
    expect(res.headers.get("Retry-After")).toBe("60")
    expect(mockExec).not.toHaveBeenCalled()
    expect(mockQueryBuilder.insert).not.toHaveBeenCalled()
  })

  it("rejects when the in-process reindex lock is active", async () => {
    ;(globalThis as any).__careconnectReindexGuard.inFlight = true

    const res = await POST()
    const { data } = await parseResponse<{ error: { message: string } }>(res)

    expect(res.status).toBe(409)
    expect(data.error.message).toBe("A reindex job is already running in this server process")
    expect(res.headers.get("Retry-After")).toBe("60")
    expect(mockExec).not.toHaveBeenCalled()
    expect(mockQueryBuilder.insert).not.toHaveBeenCalled()
  })

  it("rejects during the reindex cooldown window", async () => {
    ;(globalThis as any).__careconnectReindexGuard.lastStartedAt = Date.now()

    const res = await POST()
    const { data } = await parseResponse<{ error: { message: string; details: { retryAfterSeconds: number } } }>(res)

    expect(res.status).toBe(429)
    expect(data.error.message).toBe("Reindex cooldown is active")
    expect(data.error.details.retryAfterSeconds).toBeGreaterThan(0)
    expect(res.headers.get("Retry-After")).toBe(String(data.error.details.retryAfterSeconds))
    expect(mockExec).not.toHaveBeenCalled()
    expect(mockQueryBuilder.insert).not.toHaveBeenCalled()
  })
})
