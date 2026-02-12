import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/admin/reindex/status/route"
import { assertAdminRole } from "@/lib/auth/authorization"

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

// Mock authorization
vi.mock("@/lib/auth/authorization", () => ({
  assertAdminRole: vi.fn(),
}))

const createChainMock = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
})

const mockGetUser = vi.fn()
const tableChains: Record<string, ReturnType<typeof createChainMock>> = {}

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: (table: string) => {
    if (!tableChains[table]) {
      tableChains[table] = createChainMock()
    }
    return tableChains[table]
  },
}

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabase),
}))

describe("GET /api/admin/reindex/status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const key in tableChains) delete tableChains[key]

    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null })
    vi.mocked(assertAdminRole).mockResolvedValue(undefined as any)
  })

  it("returns 401 if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const req = new Request("http://localhost/api/admin/reindex/status")
    const res = await GET(req as any)
    const json = (await res.json()) as any

    expect(res.status).toBe(401)
    expect(json.error.message).toBe("Unauthorized")
  })

  it("returns 403 if user is not admin", async () => {
    vi.mocked(assertAdminRole).mockRejectedValue(new Error("Forbidden"))

    const req = new Request("http://localhost/api/admin/reindex/status")
    const res = await GET(req as any)

    expect(res.status).toBe(500) // handleApiError returns 500
    expect(vi.mocked(assertAdminRole)).toHaveBeenCalledWith(mockSupabase, "admin-1")
  })

  it("returns recent reindex history if no progressId provided", async () => {
    const mockOperations = [
      {
        id: "op-1",
        status: "complete",
        total_services: 100,
        processed_count: 100,
        started_at: "2024-01-01T00:00:00Z",
        completed_at: "2024-01-01T00:05:00Z",
      },
      {
        id: "op-2",
        status: "in_progress",
        total_services: 150,
        processed_count: 75,
        started_at: "2024-01-02T00:00:00Z",
        completed_at: null,
      },
    ]

    // Ensure chain is initialized
    if (!tableChains["reindex_progress"]) {
      tableChains["reindex_progress"] = createChainMock()
    }

    tableChains["reindex_progress"].limit.mockResolvedValue({
      data: mockOperations,
      error: null,
    })

    const req = new Request("http://localhost/api/admin/reindex/status")
    const res = await GET(req as any)
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.operations).toHaveLength(2)
    expect(json.data.operations).toEqual(mockOperations)

    // Verify query chain
    expect(tableChains["reindex_progress"].select).toHaveBeenCalledWith("*")
    expect(tableChains["reindex_progress"].order).toHaveBeenCalledWith("started_at", { ascending: false })
    expect(tableChains["reindex_progress"].limit).toHaveBeenCalledWith(10)
  })

  it("returns 404 if progressId not found", async () => {
    // Ensure chain is initialized
    if (!tableChains["reindex_progress"]) {
      tableChains["reindex_progress"] = createChainMock()
    }

    tableChains["reindex_progress"].single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    })

    const req = new Request("http://localhost/api/admin/reindex/status?progressId=invalid-id")
    const res = await GET(req as any)
    const json = (await res.json()) as any

    expect(res.status).toBe(404)
    expect(json.error.message).toBe("Progress record not found")
  })

  it("returns progress details for specific progressId", async () => {
    const mockProgress = {
      id: "progress-123",
      status: "in_progress",
      total_services: 200,
      processed_count: 100,
      started_at: "2024-01-01T10:00:00Z",
      completed_at: null,
      duration_seconds: null,
      error_message: null,
    }

    // Ensure chain is initialized
    if (!tableChains["reindex_progress"]) {
      tableChains["reindex_progress"] = createChainMock()
    }

    tableChains["reindex_progress"].single.mockResolvedValue({
      data: mockProgress,
      error: null,
    })

    // Mock current time to calculate elapsed seconds
    const mockNow = new Date("2024-01-01T10:05:00Z").getTime()
    vi.spyOn(Date, "now").mockReturnValue(mockNow)

    const req = new Request("http://localhost/api/admin/reindex/status?progressId=progress-123")
    const res = await GET(req as any)
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.id).toBe("progress-123")
    expect(json.data.status).toBe("in_progress")
    expect(json.data.totalServices).toBe(200)
    expect(json.data.processedCount).toBe(100)
    expect(json.data.progressPercentage).toBe(50) // 100/200 * 100
    expect(json.data.elapsedSeconds).toBe(300) // 5 minutes
    expect(json.data.startedAt).toBe("2024-01-01T10:00:00Z")
    expect(json.data.completedAt).toBeNull()
    expect(json.data.errorMessage).toBeNull()
  })

  it("calculates metrics correctly for completed operation", async () => {
    const mockProgress = {
      id: "progress-456",
      status: "complete",
      total_services: 150,
      processed_count: 150,
      started_at: "2024-01-01T10:00:00Z",
      completed_at: "2024-01-01T10:10:00Z",
      duration_seconds: 600,
      error_message: null,
    }

    // Ensure chain is initialized
    if (!tableChains["reindex_progress"]) {
      tableChains["reindex_progress"] = createChainMock()
    }

    tableChains["reindex_progress"].single.mockResolvedValue({
      data: mockProgress,
      error: null,
    })

    const req = new Request("http://localhost/api/admin/reindex/status?progressId=progress-456")
    const res = await GET(req as any)
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.progressPercentage).toBe(100) // 150/150 * 100
    expect(json.data.elapsedSeconds).toBe(600) // completed_at - started_at
    expect(json.data.durationSeconds).toBe(600)
  })

  it("handles error status with error message", async () => {
    const mockProgress = {
      id: "progress-789",
      status: "error",
      total_services: 100,
      processed_count: 50,
      started_at: "2024-01-01T10:00:00Z",
      completed_at: "2024-01-01T10:03:00Z",
      duration_seconds: 180,
      error_message: "Failed to generate embeddings",
    }

    // Ensure chain is initialized
    if (!tableChains["reindex_progress"]) {
      tableChains["reindex_progress"] = createChainMock()
    }

    tableChains["reindex_progress"].single.mockResolvedValue({
      data: mockProgress,
      error: null,
    })

    const req = new Request("http://localhost/api/admin/reindex/status?progressId=progress-789")
    const res = await GET(req as any)
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.status).toBe("error")
    expect(json.data.errorMessage).toBe("Failed to generate embeddings")
    expect(json.data.progressPercentage).toBe(50)
  })

  it("handles zero total services (edge case)", async () => {
    const mockProgress = {
      id: "progress-000",
      status: "complete",
      total_services: 0,
      processed_count: 0,
      started_at: "2024-01-01T10:00:00Z",
      completed_at: "2024-01-01T10:00:01Z",
      duration_seconds: 1,
      error_message: null,
    }

    // Ensure chain is initialized
    if (!tableChains["reindex_progress"]) {
      tableChains["reindex_progress"] = createChainMock()
    }

    tableChains["reindex_progress"].single.mockResolvedValue({
      data: mockProgress,
      error: null,
    })

    const req = new Request("http://localhost/api/admin/reindex/status?progressId=progress-000")
    const res = await GET(req as any)
    const json = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(json.data.progressPercentage).toBe(0) // Prevents division by zero
  })

  it("returns 500 if database query fails for history", async () => {
    // Ensure chain is initialized
    if (!tableChains["reindex_progress"]) {
      tableChains["reindex_progress"] = createChainMock()
    }

    tableChains["reindex_progress"].limit.mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    })

    const req = new Request("http://localhost/api/admin/reindex/status")
    const res = await GET(req as any)
    const json = (await res.json()) as any

    expect(res.status).toBe(500)
    expect(json.error.message).toContain("Failed to fetch reindex history")
  })
})
