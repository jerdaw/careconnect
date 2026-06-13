import { beforeEach, describe, expect, it, vi } from "vitest"
import { getScorecardByCycle, insertContactAttempt, updateReferralEvent } from "@/lib/pilot/storage"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"

vi.mock("@/lib/resilience/supabase-breaker", () => ({
  withCircuitBreaker: vi.fn(async <T>(operation: () => Promise<T>) => operation()),
}))

function createSupabaseMock(result: unknown) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  const from = vi.fn(() => ({ insert }))

  return {
    client: { from },
    from,
    insert,
    select,
    single,
  }
}

function createUpdateSupabaseMock(result: unknown) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn(() => ({ single }))
  const eq = vi.fn(() => ({ select }))
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ update }))

  return {
    client: { from },
    from,
    update,
    eq,
    select,
    single,
  }
}

function createScorecardSupabaseMock(result: unknown) {
  const order = vi.fn().mockResolvedValue(result)
  const query = {
    eq: vi.fn(() => query),
    order,
  }
  const select = vi.fn(() => query)
  const from = vi.fn(() => ({ select }))

  return {
    client: { from },
    from,
    select,
    eq: query.eq,
    order,
  }
}

const contactAttemptPayload = {
  id: "11111111-1111-4111-8111-111111111111",
  pilot_cycle_id: "v22-cycle-1",
  service_id: "kingston-food-bank",
  recorded_by_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
  entity_key_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  attempt_channel: "phone" as const,
  attempt_outcome: "connected" as const,
  attempted_at: "2026-03-08T15:00:00.000Z",
}

describe("pilot storage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("wraps contact-attempt writes in the Supabase circuit breaker", async () => {
    const supabase = createSupabaseMock({
      data: { id: contactAttemptPayload.id },
      error: null,
    })

    const result = await insertContactAttempt(supabase.client as never, contactAttemptPayload)

    expect(result).toEqual({
      data: { id: contactAttemptPayload.id },
      duplicate: false,
      error: null,
      missingTable: false,
    })
    expect(withCircuitBreaker).toHaveBeenCalledTimes(1)
    expect(withCircuitBreaker).toHaveBeenCalledWith(expect.any(Function))
    expect(supabase.from).toHaveBeenCalledWith("pilot_contact_attempt_events")
  })

  it("wraps referral updates in the Supabase circuit breaker", async () => {
    const supabase = createUpdateSupabaseMock({
      data: { id: "22222222-2222-4222-8222-222222222222" },
      error: null,
    })
    const updatePayload = {
      referral_state: "connected" as const,
      updated_at: "2026-03-08T16:00:00.000Z",
      terminal_at: "2026-03-08T16:00:00.000Z",
    }

    const result = await updateReferralEvent(
      supabase.client as never,
      "22222222-2222-4222-8222-222222222222",
      updatePayload
    )

    expect(result).toEqual({
      data: { id: "22222222-2222-4222-8222-222222222222" },
      duplicate: false,
      error: null,
      missingTable: false,
    })
    expect(withCircuitBreaker).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith("pilot_referral_events")
    expect(supabase.update).toHaveBeenCalledWith(updatePayload)
    expect(supabase.eq).toHaveBeenCalledWith("id", "22222222-2222-4222-8222-222222222222")
  })

  it("wraps scorecard reads in the Supabase circuit breaker", async () => {
    const supabase = createScorecardSupabaseMock({
      data: [
        {
          metric_id: "M1",
          metric_value: 0.25,
        },
      ],
      error: null,
    })

    const result = await getScorecardByCycle(
      supabase.client as never,
      "v22-cycle-1",
      "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e"
    )

    expect(result.error).toBeNull()
    expect(result.missingTable).toBe(false)
    expect(result.data?.m1_failed_contact_rate).toBe(0.25)
    expect(withCircuitBreaker).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith("pilot_metric_snapshots")
    expect(supabase.select).toHaveBeenCalledWith("metric_id, metric_value")
    expect(supabase.eq).toHaveBeenCalledWith("pilot_cycle_id", "v22-cycle-1")
    expect(supabase.eq).toHaveBeenCalledWith("org_id", "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e")
  })

  it("treats duplicate primary-key errors as idempotent when a client event id is supplied", async () => {
    const supabase = createSupabaseMock({
      data: null,
      error: {
        code: "23505",
        details: 'Key (id)=("11111111-1111-4111-8111-111111111111") already exists.',
        message: 'duplicate key value violates unique constraint "pilot_contact_attempt_events_pkey"',
      },
    })

    const result = await insertContactAttempt(supabase.client as never, contactAttemptPayload)

    expect(result).toEqual({
      data: null,
      duplicate: true,
      error: null,
      missingTable: false,
    })
    expect(supabase.from).toHaveBeenCalledWith("pilot_contact_attempt_events")
    expect(supabase.insert).toHaveBeenCalledWith(contactAttemptPayload)
  })

  it("does not suppress non-primary duplicate errors even when a client event id is supplied", async () => {
    const error = {
      code: "23505",
      details:
        "Key (pilot_cycle_id, service_id, attempted_at)=(v22-cycle-1, kingston-food-bank, 2026-03-08T15:00:00.000Z) already exists.",
      message: 'duplicate key value violates unique constraint "pilot_contact_attempt_events_replay_key"',
    }
    const supabase = createSupabaseMock({
      data: null,
      error,
    })

    const result = await insertContactAttempt(supabase.client as never, contactAttemptPayload)

    expect(result).toEqual({
      data: null,
      duplicate: false,
      error,
      missingTable: false,
    })
  })

  it("does not suppress duplicate errors when no client event id was supplied", async () => {
    const supabase = createSupabaseMock({
      data: null,
      error: {
        code: "23505",
        message: "duplicate key value violates unique constraint",
      },
    })
    const { id: _id, ...payloadWithoutId } = contactAttemptPayload

    const result = await insertContactAttempt(supabase.client as never, payloadWithoutId)

    expect(result).toEqual({
      data: null,
      duplicate: false,
      error: {
        code: "23505",
        message: "duplicate key value violates unique constraint",
      },
      missingTable: false,
    })
  })
})
