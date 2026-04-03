import { SupabaseClient } from "@supabase/supabase-js"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { PilotContactAttemptEvent } from "@/types/pilot-contact-attempt"
import { PilotReferralEvent } from "@/types/pilot-referral"
import { IntegrationFeasibilityDecision } from "@/types/integration-feasibility"
import { PilotScorecard } from "@/types/pilot-metrics"
import {
  PilotConnectionEvent,
  PilotDataDecayAudit,
  PilotPreferenceFitEvent,
  PilotServiceScopeRecord,
  ServiceOperationalStatusEvent,
} from "@/types/pilot-instrumentation"
import { PilotMetricSnapshotWrite, buildPilotScorecard } from "@/lib/observability/pilot-metrics"
import type { Database } from "@/types/supabase"

type DatabaseError = {
  code?: string
  message?: string
}

export type PilotStorageResult<T> = {
  data: T | null
  error: DatabaseError | null
  missingTable: boolean
}

type PilotSupabaseClient = SupabaseClient<Database>
type ContactAttemptRow = Database["public"]["Tables"]["pilot_contact_attempt_events"]["Row"]
type ReferralRow = Database["public"]["Tables"]["pilot_referral_events"]["Row"]
type ConnectionRow = Database["public"]["Tables"]["pilot_connection_events"]["Row"]
type ScopeRow = Database["public"]["Tables"]["pilot_service_scope"]["Row"]
type ServiceStatusRow = Database["public"]["Tables"]["service_operational_status_events"]["Row"]
type DataDecayAuditRow = Database["public"]["Tables"]["pilot_data_decay_audits"]["Row"]
type PreferenceFitRow = Database["public"]["Tables"]["pilot_preference_fit_events"]["Row"]
type IntegrationDecisionRow = Database["public"]["Tables"]["pilot_integration_feasibility_decisions"]["Row"]
type SnapshotRow = Pick<
  Database["public"]["Tables"]["pilot_metric_snapshots"]["Row"],
  "metric_id" | "metric_value" | "numerator" | "denominator" | "calculated_at"
>

function isMissingTableError(error: DatabaseError | null): boolean {
  if (!error) return false
  return error.code === "42P01" || /does not exist|relation/i.test(error.message || "")
}

export async function insertContactAttempt(
  supabase: PilotSupabaseClient,
  payload: Omit<PilotContactAttemptEvent, "id">
): Promise<PilotStorageResult<ContactAttemptRow>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase.from("pilot_contact_attempt_events").insert(payload).select().single()
  )
  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function insertReferralEvent(
  supabase: PilotSupabaseClient,
  payload: Omit<PilotReferralEvent, "id">
): Promise<PilotStorageResult<ReferralRow>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase.from("pilot_referral_events").insert(payload).select().single()
  )
  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function insertConnectionEvent(
  supabase: PilotSupabaseClient,
  payload: Omit<PilotConnectionEvent, "id">
): Promise<PilotStorageResult<ConnectionRow>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase.from("pilot_connection_events").insert(payload).select().single()
  )
  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function upsertPilotScopeService(
  supabase: PilotSupabaseClient,
  payload: Omit<PilotServiceScopeRecord, "id">
): Promise<PilotStorageResult<ScopeRow>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase
      .from("pilot_service_scope")
      .upsert(payload, { onConflict: "pilot_cycle_id,org_id,service_id" })
      .select()
      .single()
  )
  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function insertServiceOperationalStatusEvent(
  supabase: PilotSupabaseClient,
  payload: Omit<ServiceOperationalStatusEvent, "id">
): Promise<PilotStorageResult<ServiceStatusRow>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase.from("service_operational_status_events").insert(payload).select().single()
  )
  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function insertPilotDataDecayAudit(
  supabase: PilotSupabaseClient,
  payload: Omit<PilotDataDecayAudit, "id">
): Promise<PilotStorageResult<DataDecayAuditRow>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase.from("pilot_data_decay_audits").insert(payload).select().single()
  )
  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function insertPilotPreferenceFitEvent(
  supabase: PilotSupabaseClient,
  payload: Omit<PilotPreferenceFitEvent, "id">
): Promise<PilotStorageResult<PreferenceFitRow>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase.from("pilot_preference_fit_events").insert(payload).select().single()
  )
  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function updateReferralEvent(
  supabase: PilotSupabaseClient,
  id: string,
  payload: Partial<PilotReferralEvent>
): Promise<PilotStorageResult<ReferralRow>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase.from("pilot_referral_events").update(payload).eq("id", id).select().single()
  )
  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function insertIntegrationDecision(
  supabase: PilotSupabaseClient,
  payload: IntegrationFeasibilityDecision
): Promise<PilotStorageResult<IntegrationDecisionRow>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase.from("pilot_integration_feasibility_decisions").insert(payload).select().single()
  )
  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function insertPilotMetricSnapshots(
  supabase: PilotSupabaseClient,
  pilotCycleId: string,
  orgId: string,
  snapshots: PilotMetricSnapshotWrite[],
  calculatedAt: string
): Promise<PilotStorageResult<SnapshotRow[]>> {
  const rows = snapshots.map((snapshot) => ({
    pilot_cycle_id: pilotCycleId,
    org_id: orgId,
    metric_id: snapshot.metric_id,
    metric_value: snapshot.metric_value,
    numerator: snapshot.numerator,
    denominator: snapshot.denominator,
    calculated_at: calculatedAt,
  }))

  const { data, error } = await withCircuitBreaker(async () =>
    supabase
      .from("pilot_metric_snapshots")
      .insert(rows)
      .select("metric_id, metric_value, numerator, denominator, calculated_at")
  )

  return { data: data ?? null, error, missingTable: isMissingTableError(error) }
}

export async function getScorecardByCycle(
  supabase: PilotSupabaseClient,
  pilotCycleId: string,
  orgId: string
): Promise<PilotStorageResult<PilotScorecard>> {
  const { data, error } = await withCircuitBreaker(async () =>
    supabase
      .from("pilot_metric_snapshots")
      .select("metric_id, metric_value")
      .eq("pilot_cycle_id", pilotCycleId)
      .eq("org_id", orgId)
      .order("calculated_at", { ascending: false })
  )

  if (isMissingTableError(error)) {
    return { data: null, error, missingTable: true }
  }

  if (error || !data) {
    return { data: null, error, missingTable: false }
  }

  const byMetric = new Map<SnapshotRow["metric_id"], number | null>()

  // Query is ordered by calculated_at DESC; keep first value per metric as latest.
  for (const row of data) {
    if (!byMetric.has(row.metric_id)) {
      byMetric.set(row.metric_id, row.metric_value)
    }
  }

  const scorecard = buildPilotScorecard(
    pilotCycleId,
    {
      totalContactAttempts: 1,
      failedContactAttempts: byMetric.get("M1") ?? 0,
      p50SecondsToConnection: byMetric.get("M2_P50") ?? null,
      p75SecondsToConnection: byMetric.get("M2_P75") ?? null,
      p90SecondsToConnection: byMetric.get("M2_P90") ?? null,
      totalReferrals: 1,
      terminalReferrals: byMetric.get("M3") ?? 0,
      servicesInPilotScope: 1,
      servicesMeetingSla: byMetric.get("M4") ?? 0,
      totalEntitiesForRepeatFailure: 1,
      entitiesWith2PlusFailures: byMetric.get("M5") ?? 0,
      dataDecaySampleSize: 1,
      dataDecayFatalCount: byMetric.get("M6") ?? 0,
      preferenceFitTaskCount: 1,
      preferenceFitCareConnectTaskCount: byMetric.get("M7") ?? 0,
    },
    new Date().toISOString()
  )

  scorecard.m1_failed_contact_rate = byMetric.get("M1") ?? null
  scorecard.m3_referral_completion_capture_rate = byMetric.get("M3") ?? null
  scorecard.m4_freshness_sla_compliance = byMetric.get("M4") ?? null
  scorecard.m5_repeat_failure_rate = byMetric.get("M5") ?? null
  scorecard.m6_data_decay_fatal_error_rate = byMetric.get("M6") ?? null
  scorecard.m7_preference_fit_indicator = byMetric.get("M7") ?? null

  return { data: scorecard, error: null, missingTable: false }
}
