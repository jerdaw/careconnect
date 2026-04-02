import { describe, it, expect } from "vitest"
import {
  PilotConnectionCreateSchema,
  PilotContactAttemptCreateSchema,
  PilotDataDecayAuditCreateSchema,
  PilotMetricsRecomputeSchema,
  PilotPreferenceFitEventCreateSchema,
  PilotReferralCreateSchema,
  PilotReferralUpdateSchema,
  PilotServiceScopeCreateSchema,
  ServiceOperationalStatusEventCreateSchema,
} from "@/lib/schemas/pilot-events"

describe("pilot-events schema", () => {
  it("accepts a valid contact attempt payload", () => {
    const result = PilotContactAttemptCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      service_id: "kingston-food-bank",
      recorded_by_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      entity_key_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      attempt_channel: "phone",
      attempt_outcome: "connected",
      attempted_at: "2026-03-08T15:00:00.000Z",
    })

    expect(result.success).toBe(true)
  })

  it("rejects contact payload with disallowed privacy field", () => {
    const result = PilotContactAttemptCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      service_id: "kingston-food-bank",
      recorded_by_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      entity_key_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      attempt_channel: "phone",
      attempt_outcome: "connected",
      attempted_at: "2026-03-08T15:00:00.000Z",
      query_text: "i need food",
    })

    expect(result.success).toBe(false)
  })

  it("rejects contact payload with invalid entity_key_hash", () => {
    const result = PilotContactAttemptCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      service_id: "kingston-food-bank",
      recorded_by_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      entity_key_hash: "not-a-hash",
      attempt_channel: "phone",
      attempt_outcome: "connected",
      attempted_at: "2026-03-08T15:00:00.000Z",
    })

    expect(result.success).toBe(false)
  })

  it("accepts a valid referral create payload", () => {
    const result = PilotReferralCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      target_service_id: "kingston-housing-help",
      referral_state: "initiated",
      created_at: "2026-03-08T15:00:00.000Z",
      updated_at: "2026-03-08T15:00:00.000Z",
    })

    expect(result.success).toBe(true)
  })

  it("rejects terminal referral state update without terminal_at", () => {
    const result = PilotReferralUpdateSchema.safeParse({
      source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      referral_state: "failed",
      updated_at: "2026-03-08T15:00:00.000Z",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "terminal_at")).toBe(true)
    }
  })

  it("rejects initiated referral update with failure_reason_code", () => {
    const result = PilotReferralUpdateSchema.safeParse({
      source_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      referral_state: "initiated",
      updated_at: "2026-03-08T15:00:00.000Z",
      failure_reason_code: "no_response",
    })

    expect(result.success).toBe(false)
  })

  it("accepts a valid connection payload with exactly one anchor", () => {
    const result = PilotConnectionCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      service_id: "svc-1",
      connected_at: "2026-03-08T15:30:00.000Z",
      contact_attempt_event_id: "11111111-1111-1111-1111-111111111111",
    })

    expect(result.success).toBe(true)
  })

  it("rejects connection payloads with zero or multiple anchors", () => {
    const noAnchor = PilotConnectionCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      service_id: "svc-1",
      connected_at: "2026-03-08T15:30:00.000Z",
    })
    const twoAnchors = PilotConnectionCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      service_id: "svc-1",
      connected_at: "2026-03-08T15:30:00.000Z",
      contact_attempt_event_id: "11111111-1111-1111-1111-111111111111",
      referral_event_id: "22222222-2222-2222-2222-222222222222",
    })

    expect(noAnchor.success).toBe(false)
    expect(twoAnchors.success).toBe(false)
  })

  it("accepts a valid pilot scope payload", () => {
    const result = PilotServiceScopeCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      service_id: "svc-1",
      sla_tier: "high_demand",
    })

    expect(result.success).toBe(true)
  })

  it("accepts a valid service status payload", () => {
    const result = ServiceOperationalStatusEventCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      service_id: "svc-1",
      checked_at: "2026-03-08T15:30:00.000Z",
      status_code: "available",
    })

    expect(result.success).toBe(true)
  })

  it("rejects non-fatal data decay audits with a fatal category", () => {
    const result = PilotDataDecayAuditCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      service_id: "svc-1",
      audited_at: "2026-03-08T15:30:00.000Z",
      is_fatal: false,
      fatal_error_category: "wrong_or_disconnected_phone",
      verification_mode: "web_plus_call",
    })

    expect(result.success).toBe(false)
  })

  it("accepts valid preference-fit and recompute payloads", () => {
    const preferenceFit = PilotPreferenceFitEventCreateSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
      cohort_label: "self_serve_mobile",
      recorded_at: "2026-03-08T15:30:00.000Z",
      preferred_via_helpbridge: true,
    })
    const recompute = PilotMetricsRecomputeSchema.safeParse({
      pilot_cycle_id: "v22-cycle-1",
      org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
    })

    expect(preferenceFit.success).toBe(true)
    expect(recompute.success).toBe(true)
  })
})
