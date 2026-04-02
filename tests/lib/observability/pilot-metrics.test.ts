import { describe, it, expect } from "vitest"
import {
  computePilotMetricSnapshots,
  computeFailedContactRate,
  computeReferralCompletionCaptureRate,
  buildPilotScorecard,
  evaluateGate1Thresholds,
} from "@/lib/observability/pilot-metrics"

describe("pilot-metrics", () => {
  it("computes failed contact rate from outcomes", () => {
    const rate = computeFailedContactRate(["connected", "no_response", "invalid_routing", "connected"])
    expect(rate).toBe(0.5)
  })

  it("computes referral completion capture rate from states", () => {
    const rate = computeReferralCompletionCaptureRate(["initiated", "connected", "failed", "no_response_timeout"])
    expect(rate).toBe(0.75)
  })

  it("builds a scorecard with rate-based metrics", () => {
    const scorecard = buildPilotScorecard("v22-cycle-1", {
      totalContactAttempts: 10,
      failedContactAttempts: 3,
      p50SecondsToConnection: 3600,
      p75SecondsToConnection: 5400,
      p90SecondsToConnection: 8600,
      totalReferrals: 8,
      terminalReferrals: 5,
      servicesInPilotScope: 10,
      servicesMeetingSla: 8,
      totalEntitiesForRepeatFailure: 7,
      entitiesWith2PlusFailures: 1,
      dataDecaySampleSize: 20,
      dataDecayFatalCount: 1,
      preferenceFitTaskCount: 12,
      preferenceFitKccTaskCount: 9,
    })

    expect(scorecard.m1_failed_contact_rate).toBe(0.3)
    expect(scorecard.m3_referral_completion_capture_rate).toBe(0.625)
    expect(scorecard.m4_freshness_sla_compliance).toBe(0.8)
    expect(scorecard.m6_data_decay_fatal_error_rate).toBe(0.05)
    expect(scorecard.m7_preference_fit_indicator).toBe(0.75)
  })

  it("evaluates Gate 1 thresholds as pass when all criteria are met", () => {
    const scorecard = buildPilotScorecard("v22-cycle-1", {
      totalContactAttempts: 100,
      failedContactAttempts: 35,
      p50SecondsToConnection: 7200,
      p75SecondsToConnection: 8100,
      p90SecondsToConnection: 9200,
      totalReferrals: 100,
      terminalReferrals: 60,
      servicesInPilotScope: 20,
      servicesMeetingSla: 15,
      totalEntitiesForRepeatFailure: 50,
      entitiesWith2PlusFailures: 5,
      dataDecaySampleSize: 20,
      dataDecayFatalCount: 2,
      preferenceFitTaskCount: 50,
      preferenceFitKccTaskCount: 35,
    })

    const gate = evaluateGate1Thresholds(scorecard, 0.55, 10000)
    expect(gate.passedAll).toBe(true)
  })

  it("evaluates Gate 1 thresholds as fail when criteria are missed", () => {
    const scorecard = buildPilotScorecard("v22-cycle-1", {
      totalContactAttempts: 100,
      failedContactAttempts: 48,
      p50SecondsToConnection: 9500,
      p75SecondsToConnection: 9900,
      p90SecondsToConnection: 11500,
      totalReferrals: 100,
      terminalReferrals: 40,
      servicesInPilotScope: 20,
      servicesMeetingSla: 12,
      totalEntitiesForRepeatFailure: 50,
      entitiesWith2PlusFailures: 20,
      dataDecaySampleSize: 20,
      dataDecayFatalCount: 4,
      preferenceFitTaskCount: 50,
      preferenceFitKccTaskCount: 20,
    })

    const gate = evaluateGate1Thresholds(scorecard, 0.5, 10000)
    expect(gate.passedAll).toBe(false)
    expect(gate.freshnessSlaPass).toBe(false)
  })

  it("fails baseline-dependent checks when baselines are zero or missing", () => {
    const scorecard = buildPilotScorecard("v22-cycle-1", {
      totalContactAttempts: 100,
      failedContactAttempts: 20,
      p50SecondsToConnection: 4000,
      p75SecondsToConnection: 6000,
      p90SecondsToConnection: 9000,
      totalReferrals: 100,
      terminalReferrals: 70,
      servicesInPilotScope: 20,
      servicesMeetingSla: 16,
      totalEntitiesForRepeatFailure: 50,
      entitiesWith2PlusFailures: 4,
      dataDecaySampleSize: 20,
      dataDecayFatalCount: 1,
      preferenceFitTaskCount: 50,
      preferenceFitKccTaskCount: 35,
    })

    const zeroBaselineGate = evaluateGate1Thresholds(scorecard, 0, 0)
    expect(zeroBaselineGate.failedContactRateReductionPass).toBe(false)
    expect(zeroBaselineGate.timeToConnectionReductionPass).toBe(false)
  })

  it("computes pilot metric snapshots for M2/M4/M5/M6/M7 from source records", () => {
    const computed = computePilotMetricSnapshots(
      "v22-cycle-1",
      {
        contactAttempts: [
          {
            id: "attempt-1",
            attempted_at: "2026-03-08T10:00:00.000Z",
            attempt_outcome: "no_response",
            entity_key_hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
          {
            id: "attempt-2",
            attempted_at: "2026-03-08T10:05:00.000Z",
            attempt_outcome: "connected",
            entity_key_hash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
          {
            id: "attempt-3",
            attempted_at: "2026-03-08T10:10:00.000Z",
            attempt_outcome: "invalid_routing",
            entity_key_hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
        ],
        referrals: [
          {
            id: "ref-1",
            created_at: "2026-03-08T11:00:00.000Z",
            referral_state: "connected",
          },
        ],
        connections: [
          {
            connected_at: "2026-03-08T10:20:00.000Z",
            contact_attempt_event_id: "attempt-1",
            referral_event_id: null,
          },
          {
            connected_at: "2026-03-08T11:30:00.000Z",
            contact_attempt_event_id: null,
            referral_event_id: "ref-1",
          },
        ],
        scopeServices: [
          { service_id: "svc-1", sla_tier: "crisis" },
          { service_id: "svc-2", sla_tier: "standard" },
        ],
        serviceStatusEvents: [
          {
            service_id: "svc-1",
            checked_at: "2026-03-09T11:00:00.000Z",
            status_code: "available",
          },
          {
            service_id: "svc-2",
            checked_at: "2026-03-01T11:00:00.000Z",
            status_code: "unknown",
          },
        ],
        dataDecayAudits: [
          {
            audited_at: "2026-03-08T12:00:00.000Z",
            is_fatal: true,
            fatal_error_category: "wrong_or_disconnected_phone",
          },
          {
            audited_at: "2026-03-08T12:05:00.000Z",
            is_fatal: false,
            fatal_error_category: null,
          },
        ],
        preferenceFitEvents: [
          {
            recorded_at: "2026-03-08T13:00:00.000Z",
            preferred_via_helpbridge: true,
          },
          {
            recorded_at: "2026-03-08T13:05:00.000Z",
            preferred_via_helpbridge: false,
          },
        ],
      },
      "2026-03-09T12:00:00.000Z"
    )

    expect(computed.scorecard.m2_p50_seconds_to_connection).toBe(1500)
    expect(computed.scorecard.m4_freshness_sla_compliance).toBe(0.5)
    expect(computed.scorecard.m5_repeat_failure_rate).toBe(0.5)
    expect(computed.scorecard.m6_data_decay_fatal_error_rate).toBe(0.5)
    expect(computed.scorecard.m7_preference_fit_indicator).toBe(0.5)
    expect(computed.snapshots.map((snapshot) => snapshot.metric_id)).toEqual([
      "M1",
      "M2_P50",
      "M2_P75",
      "M2_P90",
      "M3",
      "M4",
      "M5",
      "M6",
      "M7",
    ])
  })
})
