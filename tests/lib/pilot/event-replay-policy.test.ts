import { describe, expect, it } from "vitest"
import {
  buildPilotEventReplayFingerprint,
  buildPilotEventReplayMaterial,
  PILOT_EVENT_REPLAY_CRITERIA,
  type PilotReplayPayloads,
} from "@/lib/pilot/event-replay-policy"

const contactAttemptPayload = {
  pilot_cycle_id: "v22-cycle-1",
  service_id: "kingston-food-bank",
  recorded_by_org_id: "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e",
  entity_key_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  attempt_channel: "phone",
  attempt_outcome: "connected",
  attempted_at: "2026-03-08T15:00:00.000Z",
  resolved_at: "2026-03-08T15:05:00.000Z",
  outcome_notes_code: "busy_signal",
} satisfies PilotReplayPayloads["contact_attempt"]

describe("pilot event replay policy", () => {
  it("builds deterministic replay fingerprints from criteria fields", () => {
    const fingerprint = buildPilotEventReplayFingerprint("contact_attempt", contactAttemptPayload)
    const reorderedPayload = {
      attempted_at: contactAttemptPayload.attempted_at,
      attempt_outcome: contactAttemptPayload.attempt_outcome,
      attempt_channel: contactAttemptPayload.attempt_channel,
      entity_key_hash: contactAttemptPayload.entity_key_hash,
      recorded_by_org_id: contactAttemptPayload.recorded_by_org_id,
      service_id: contactAttemptPayload.service_id,
      pilot_cycle_id: contactAttemptPayload.pilot_cycle_id,
      outcome_notes_code: contactAttemptPayload.outcome_notes_code,
      resolved_at: contactAttemptPayload.resolved_at,
    } satisfies PilotReplayPayloads["contact_attempt"]

    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/)
    expect(buildPilotEventReplayFingerprint("contact_attempt", reorderedPayload)).toBe(fingerprint)
  })

  it("changes fingerprints when replay criteria change", () => {
    const baseline = buildPilotEventReplayFingerprint("contact_attempt", contactAttemptPayload)
    const changed = buildPilotEventReplayFingerprint("contact_attempt", {
      ...contactAttemptPayload,
      attempt_outcome: "no_response",
    })

    expect(changed).not.toBe(baseline)
  })

  it("includes event kind so different event types cannot collide on shared fields alone", () => {
    const statusPayload = {
      pilot_cycle_id: contactAttemptPayload.pilot_cycle_id,
      org_id: contactAttemptPayload.recorded_by_org_id,
      service_id: contactAttemptPayload.service_id,
      checked_at: contactAttemptPayload.attempted_at,
      status_code: "available",
    } satisfies PilotReplayPayloads["service_status"]

    expect(buildPilotEventReplayFingerprint("service_status", statusPayload)).not.toBe(
      buildPilotEventReplayFingerprint("contact_attempt", contactAttemptPayload)
    )
  })

  it("ignores fields outside the replay criteria", () => {
    const payloadWithExtraField = {
      ...contactAttemptPayload,
      contact_phone: "555-0100",
    } as PilotReplayPayloads["contact_attempt"]

    const material = buildPilotEventReplayMaterial("contact_attempt", payloadWithExtraField)

    expect(Object.keys(material.criteria)).toEqual([...PILOT_EVENT_REPLAY_CRITERIA.contact_attempt])
    expect(JSON.stringify(material)).not.toContain("555-0100")
  })
})
