import { describe, expect, it, vi } from "vitest"
import { PILOT_RECOMPUTE_MAX_SOURCE_ROWS, recomputePilotMetrics } from "@/lib/pilot/recompute"
import { insertPilotMetricSnapshots } from "@/lib/pilot/storage"

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: vi.fn((operation: () => unknown) => operation()),
}))

vi.mock("@/lib/pilot/storage", () => ({
  insertPilotMetricSnapshots: vi.fn().mockResolvedValue({
    data: [],
    duplicate: false,
    error: null,
    missingTable: false,
  }),
}))

function createQuery(data: unknown[]) {
  const result = { data, error: null }
  const chain: Record<string, unknown> = {}

  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.limit = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (value: typeof result) => unknown, reject: (error: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)

  return chain
}

describe("recomputePilotMetrics source bounds", () => {
  it("rejects a source table above the cap before writing snapshots", async () => {
    const oversizedContactAttempts = Array.from({ length: PILOT_RECOMPUTE_MAX_SOURCE_ROWS + 1 }, (_, index) => ({
      id: `attempt-${index}`,
      attempted_at: "2026-07-18T12:00:00.000Z",
      attempt_outcome: "connected",
      entity_key_hash: null,
    }))

    const supabase = {
      from: vi.fn((table: string) =>
        createQuery(table === "pilot_contact_attempt_events" ? oversizedContactAttempts : [])
      ),
    }

    const result = await recomputePilotMetrics(supabase as never, "v22-cycle-1", "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e")

    expect(result.data).toBeNull()
    expect(result.error?.code).toBe("PILOT_RECOMPUTE_SOURCE_LIMIT")
    expect(insertPilotMetricSnapshots).not.toHaveBeenCalled()
  })
})
