import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/admin/reindex/proof/route"
import { assertAdminRole } from "@/lib/auth/authorization"

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

vi.mock("@/lib/auth/authorization", () => ({
  assertAdminRole: vi.fn(),
}))

const createChainMock = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn(),
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

describe("GET /api/admin/reindex/proof", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const key in tableChains) delete tableChains[key]

    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null })
    vi.mocked(assertAdminRole).mockResolvedValue(undefined as any)
  })

  it("returns 401 if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await GET()
    const json = (await res.json()) as any

    expect(res.status).toBe(401)
    expect(json.error.message).toBe("Unauthorized")
  })

  it("returns aggregate value-free reindex proof metadata", async () => {
    tableChains.reindex_progress = createChainMock()
    tableChains.admin_actions = createChainMock()

    tableChains.reindex_progress.limit.mockResolvedValue({
      data: [
        {
          id: "must-not-be-returned",
          status: "running",
          triggered_by: "must-not-be-returned",
          started_at: "2026-06-29T20:00:00Z",
        },
        {
          status: "complete",
          started_at: "2026-06-29T19:00:00Z",
        },
      ],
      error: null,
    })
    tableChains.admin_actions.limit.mockResolvedValue({
      data: [
        {
          performed_by: "must-not-be-returned",
          action: "reindex",
          details: { status: "started", progress_id: "must-not-be-returned" },
        },
        {
          action: "reindex",
          details: { status: "blocked", reason: "already_running", active_progress_id: "must-not-be-returned" },
        },
      ],
      error: null,
    })

    const res = await GET()
    const json = (await res.json()) as any
    const rendered = JSON.stringify(json)

    expect(res.status).toBe(200)
    expect(json.data.authenticatedAdminAvailable).toBe("yes")
    expect(json.data.progressRowsClass).toBe("multiple")
    expect(json.data.adminActionRowsClass).toBe("multiple")
    expect(json.data.runningProgressObserved).toBe("yes")
    expect(json.data.terminalProgressObserved).toBe("yes")
    expect(json.data.structuredActionLogObserved).toBe("yes")
    expect(json.data.startedActionObserved).toBe("yes")
    expect(json.data.blockedActionObserved).toBe("yes")
    expect(json.data.alreadyRunningReasonObserved).toBe("yes")
    expect(json.data.timeoutGuardrailConfigured).toBe(true)
    expect(json.data.rawRowsStored).toBe(false)
    expect(json.data.rawUserIdsStored).toBe(false)
    expect(json.data.cookiesCollected).toBe(false)
    expect(rendered).not.toContain("must-not-be-returned")
    expect(rendered).not.toMatch(/performed_by|progress_id|triggered_by/)
  })

  it("returns a bounded 500 when proof metadata query fails", async () => {
    tableChains.reindex_progress = createChainMock()
    tableChains.reindex_progress.limit.mockResolvedValue({
      data: null,
      error: { message: "raw message should not be reflected" },
    })

    const res = await GET()
    const json = (await res.json()) as any

    expect(res.status).toBe(500)
    expect(json.error.message).toBe("Failed to fetch reindex proof progress")
    expect(JSON.stringify(json)).not.toContain("raw message should not be reflected")
  })
})
