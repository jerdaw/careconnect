import { PilotMetricId, PilotScorecard } from "@/types/pilot-metrics"
import { AttemptOutcome } from "@/types/pilot-contact-attempt"
import { ReferralState } from "@/types/pilot-referral"
import {
  PilotDataDecayFatalErrorCategory,
  PilotScopeSlaTier,
  ServiceOperationalStatusCode,
} from "@/types/pilot-instrumentation"

const FAILURE_OUTCOMES: ReadonlySet<AttemptOutcome> = new Set<AttemptOutcome>([
  "disconnected_number",
  "no_response",
  "intake_unavailable",
  "invalid_routing",
  "other_failure",
])

const TERMINAL_REFERRAL_STATES: ReadonlySet<ReferralState> = new Set<ReferralState>([
  "connected",
  "failed",
  "client_withdrew",
  "no_response_timeout",
])

export interface PilotScorecardInputs {
  totalContactAttempts: number
  failedContactAttempts: number
  p50SecondsToConnection: number | null
  p75SecondsToConnection: number | null
  p90SecondsToConnection: number | null
  totalReferrals: number
  terminalReferrals: number
  servicesInPilotScope: number
  servicesMeetingSla: number
  totalEntitiesForRepeatFailure: number
  entitiesWith2PlusFailures: number
  dataDecaySampleSize: number
  dataDecayFatalCount: number
  preferenceFitTaskCount: number
  preferenceFitCareConnectTaskCount: number
}

export interface Gate1ThresholdEvaluation {
  failedContactRateReductionPass: boolean
  timeToConnectionReductionPass: boolean
  freshnessSlaPass: boolean
  referralCapturePass: boolean
  fatalErrorRatePass: boolean
  passedAll: boolean
}

export interface PilotMetricSnapshotWrite {
  metric_id: PilotMetricId
  metric_value: number | null
  numerator: number | null
  denominator: number | null
}

export interface PilotMetricSourceContactAttempt {
  id: string
  attempted_at: string
  attempt_outcome: AttemptOutcome
  entity_key_hash?: string | null
}

export interface PilotMetricSourceReferral {
  id: string
  created_at: string
  referral_state: ReferralState
}

export interface PilotMetricSourceConnection {
  connected_at: string
  contact_attempt_event_id?: string | null
  referral_event_id?: string | null
}

export interface PilotMetricSourceScopeService {
  service_id: string
  sla_tier: PilotScopeSlaTier
}

export interface PilotMetricSourceServiceStatus {
  service_id: string
  checked_at: string
  status_code: ServiceOperationalStatusCode
}

export interface PilotMetricSourceDataDecayAudit {
  audited_at: string
  is_fatal: boolean
  fatal_error_category?: PilotDataDecayFatalErrorCategory | null
}

export interface PilotMetricSourcePreferenceFitEvent {
  recorded_at: string
  preferred_via_careconnect: boolean
}

export interface PilotMetricSourceSet {
  contactAttempts: PilotMetricSourceContactAttempt[]
  referrals: PilotMetricSourceReferral[]
  connections: PilotMetricSourceConnection[]
  scopeServices: PilotMetricSourceScopeService[]
  serviceStatusEvents: PilotMetricSourceServiceStatus[]
  dataDecayAudits: PilotMetricSourceDataDecayAudit[]
  preferenceFitEvents: PilotMetricSourcePreferenceFitEvent[]
}

function computeRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return numerator / denominator
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 1) {
    return sorted[0] ?? null
  }

  const position = (p / 100) * (sorted.length - 1)
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const lowerValue = sorted[lowerIndex]
  const upperValue = sorted[upperIndex]

  if (lowerValue === undefined || upperValue === undefined) {
    return null
  }

  if (lowerIndex === upperIndex) {
    return lowerValue
  }

  const weight = position - lowerIndex
  return lowerValue + (upperValue - lowerValue) * weight
}

function getSlaWindowHours(tier: PilotScopeSlaTier): number {
  switch (tier) {
    case "crisis":
      return 24
    case "high_demand":
      return 48
    case "standard":
      return 24 * 7
  }
}

export function computeFailedContactRate(outcomes: AttemptOutcome[]): number | null {
  if (outcomes.length === 0) return null
  const failed = outcomes.filter((outcome) => FAILURE_OUTCOMES.has(outcome)).length
  return failed / outcomes.length
}

export function computeReferralCompletionCaptureRate(states: ReferralState[]): number | null {
  if (states.length === 0) return null
  const terminal = states.filter((state) => TERMINAL_REFERRAL_STATES.has(state)).length
  return terminal / states.length
}

export function computePilotMetricSnapshots(
  pilotCycleId: string,
  sources: PilotMetricSourceSet,
  generatedAt?: string
): { scorecard: PilotScorecard; snapshots: PilotMetricSnapshotWrite[] } {
  const generated_at = generatedAt ?? new Date().toISOString()

  const failedContactAttempts = sources.contactAttempts.filter((attempt) =>
    FAILURE_OUTCOMES.has(attempt.attempt_outcome)
  ).length
  const terminalReferrals = sources.referrals.filter((referral) =>
    TERMINAL_REFERRAL_STATES.has(referral.referral_state)
  ).length

  const attemptMap = new Map(sources.contactAttempts.map((attempt) => [attempt.id, attempt.attempted_at]))
  const referralMap = new Map(sources.referrals.map((referral) => [referral.id, referral.created_at]))
  const connectionDurationsSeconds = sources.connections
    .map((connection) => {
      const anchorAt = connection.contact_attempt_event_id
        ? attemptMap.get(connection.contact_attempt_event_id)
        : connection.referral_event_id
          ? referralMap.get(connection.referral_event_id)
          : null

      if (!anchorAt) return null

      const anchorMs = new Date(anchorAt).getTime()
      const connectedMs = new Date(connection.connected_at).getTime()
      if (Number.isNaN(anchorMs) || Number.isNaN(connectedMs) || connectedMs < anchorMs) {
        return null
      }

      return Math.round((connectedMs - anchorMs) / 1000)
    })
    .filter((value): value is number => value !== null)

  const latestStatusCheckByService = new Map<string, string>()
  for (const event of [...sources.serviceStatusEvents].sort((a, b) => b.checked_at.localeCompare(a.checked_at))) {
    if (!latestStatusCheckByService.has(event.service_id)) {
      latestStatusCheckByService.set(event.service_id, event.checked_at)
    }
  }

  const generatedAtMs = new Date(generated_at).getTime()
  const servicesMeetingSla = sources.scopeServices.filter((service) => {
    const latestCheck = latestStatusCheckByService.get(service.service_id)
    if (!latestCheck) return false
    const checkedAtMs = new Date(latestCheck).getTime()
    if (Number.isNaN(checkedAtMs) || Number.isNaN(generatedAtMs)) return false
    const hoursSinceCheck = (generatedAtMs - checkedAtMs) / (1000 * 60 * 60)
    return hoursSinceCheck <= getSlaWindowHours(service.sla_tier)
  }).length

  const distinctEntityKeys = new Set<string>()
  const failureCountsByEntity = new Map<string, number>()
  for (const attempt of sources.contactAttempts) {
    if (!attempt.entity_key_hash) continue
    distinctEntityKeys.add(attempt.entity_key_hash)
    if (!FAILURE_OUTCOMES.has(attempt.attempt_outcome)) continue
    failureCountsByEntity.set(attempt.entity_key_hash, (failureCountsByEntity.get(attempt.entity_key_hash) ?? 0) + 1)
  }

  const entitiesWith2PlusFailures = [...failureCountsByEntity.values()].filter((count) => count >= 2).length
  const fatalDataDecayCount = sources.dataDecayAudits.filter((audit) => audit.is_fatal).length
  const preferredViaCareConnectCount = sources.preferenceFitEvents.filter(
    (event) => event.preferred_via_careconnect
  ).length

  const scorecard = buildPilotScorecard(
    pilotCycleId,
    {
      totalContactAttempts: sources.contactAttempts.length,
      failedContactAttempts,
      p50SecondsToConnection: percentile(connectionDurationsSeconds, 50),
      p75SecondsToConnection: percentile(connectionDurationsSeconds, 75),
      p90SecondsToConnection: percentile(connectionDurationsSeconds, 90),
      totalReferrals: sources.referrals.length,
      terminalReferrals,
      servicesInPilotScope: sources.scopeServices.length,
      servicesMeetingSla,
      totalEntitiesForRepeatFailure: distinctEntityKeys.size,
      entitiesWith2PlusFailures,
      dataDecaySampleSize: sources.dataDecayAudits.length,
      dataDecayFatalCount: fatalDataDecayCount,
      preferenceFitTaskCount: sources.preferenceFitEvents.length,
      preferenceFitCareConnectTaskCount: preferredViaCareConnectCount,
    },
    generated_at
  )

  return {
    scorecard,
    snapshots: [
      {
        metric_id: "M1",
        metric_value: scorecard.m1_failed_contact_rate,
        numerator: failedContactAttempts,
        denominator: sources.contactAttempts.length,
      },
      {
        metric_id: "M2_P50",
        metric_value: scorecard.m2_p50_seconds_to_connection,
        numerator: null,
        denominator: connectionDurationsSeconds.length,
      },
      {
        metric_id: "M2_P75",
        metric_value: scorecard.m2_p75_seconds_to_connection,
        numerator: null,
        denominator: connectionDurationsSeconds.length,
      },
      {
        metric_id: "M2_P90",
        metric_value: scorecard.m2_p90_seconds_to_connection,
        numerator: null,
        denominator: connectionDurationsSeconds.length,
      },
      {
        metric_id: "M3",
        metric_value: scorecard.m3_referral_completion_capture_rate,
        numerator: terminalReferrals,
        denominator: sources.referrals.length,
      },
      {
        metric_id: "M4",
        metric_value: scorecard.m4_freshness_sla_compliance,
        numerator: servicesMeetingSla,
        denominator: sources.scopeServices.length,
      },
      {
        metric_id: "M5",
        metric_value: scorecard.m5_repeat_failure_rate,
        numerator: entitiesWith2PlusFailures,
        denominator: distinctEntityKeys.size,
      },
      {
        metric_id: "M6",
        metric_value: scorecard.m6_data_decay_fatal_error_rate,
        numerator: fatalDataDecayCount,
        denominator: sources.dataDecayAudits.length,
      },
      {
        metric_id: "M7",
        metric_value: scorecard.m7_preference_fit_indicator,
        numerator: preferredViaCareConnectCount,
        denominator: sources.preferenceFitEvents.length,
      },
    ],
  }
}

export function buildPilotScorecard(
  pilotCycleId: string,
  inputs: PilotScorecardInputs,
  generatedAt?: string
): PilotScorecard {
  return {
    pilot_cycle_id: pilotCycleId,
    generated_at: generatedAt ?? new Date().toISOString(),
    m1_failed_contact_rate: computeRate(inputs.failedContactAttempts, inputs.totalContactAttempts),
    m2_p50_seconds_to_connection: inputs.p50SecondsToConnection,
    m2_p75_seconds_to_connection: inputs.p75SecondsToConnection,
    m2_p90_seconds_to_connection: inputs.p90SecondsToConnection,
    m3_referral_completion_capture_rate: computeRate(inputs.terminalReferrals, inputs.totalReferrals),
    m4_freshness_sla_compliance: computeRate(inputs.servicesMeetingSla, inputs.servicesInPilotScope),
    m5_repeat_failure_rate: computeRate(inputs.entitiesWith2PlusFailures, inputs.totalEntitiesForRepeatFailure),
    m6_data_decay_fatal_error_rate: computeRate(inputs.dataDecayFatalCount, inputs.dataDecaySampleSize),
    m7_preference_fit_indicator: computeRate(inputs.preferenceFitCareConnectTaskCount, inputs.preferenceFitTaskCount),
  }
}

export function evaluateGate1Thresholds(
  scorecard: PilotScorecard,
  baselineFailedContactRate: number | null,
  baselineP50SecondsToConnection: number | null
): Gate1ThresholdEvaluation {
  const failedContactRateReduction =
    baselineFailedContactRate !== null && baselineFailedContactRate > 0 && scorecard.m1_failed_contact_rate !== null
      ? (baselineFailedContactRate - scorecard.m1_failed_contact_rate) / baselineFailedContactRate
      : null

  const connectionTimeReduction =
    baselineP50SecondsToConnection !== null &&
    baselineP50SecondsToConnection > 0 &&
    scorecard.m2_p50_seconds_to_connection !== null
      ? (baselineP50SecondsToConnection - scorecard.m2_p50_seconds_to_connection) / baselineP50SecondsToConnection
      : null

  const failedContactRateReductionPass = failedContactRateReduction !== null && failedContactRateReduction >= 0.3
  const timeToConnectionReductionPass = connectionTimeReduction !== null && connectionTimeReduction >= 0.25
  const freshnessSlaPass =
    scorecard.m4_freshness_sla_compliance !== null && scorecard.m4_freshness_sla_compliance >= 0.7
  const referralCapturePass =
    scorecard.m3_referral_completion_capture_rate !== null && scorecard.m3_referral_completion_capture_rate >= 0.5
  const fatalErrorRatePass =
    scorecard.m6_data_decay_fatal_error_rate !== null && scorecard.m6_data_decay_fatal_error_rate <= 0.1

  return {
    failedContactRateReductionPass,
    timeToConnectionReductionPass,
    freshnessSlaPass,
    referralCapturePass,
    fatalErrorRatePass,
    passedAll:
      failedContactRateReductionPass &&
      timeToConnectionReductionPass &&
      freshnessSlaPass &&
      referralCapturePass &&
      fatalErrorRatePass,
  }
}
