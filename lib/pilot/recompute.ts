import { SupabaseClient } from "@supabase/supabase-js"
import { computePilotMetricSnapshots } from "@/lib/observability/pilot-metrics"
import { insertPilotMetricSnapshots } from "@/lib/pilot/storage"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { ATTEMPT_OUTCOMES, type AttemptOutcome } from "@/types/pilot-contact-attempt"
import { REFERRAL_STATES, type ReferralState } from "@/types/pilot-referral"
import {
  PILOT_DATA_DECAY_FATAL_ERROR_CATEGORIES,
  PILOT_SCOPE_SLA_TIERS,
  SERVICE_OPERATIONAL_STATUS_CODES,
  type PilotDataDecayFatalErrorCategory,
  type PilotScopeSlaTier,
  type ServiceOperationalStatusCode,
} from "@/types/pilot-instrumentation"
import type { Database } from "@/types/supabase"

type PilotSupabaseClient = SupabaseClient<Database>
type DatabaseError = {
  code?: string
  message?: string
}

type QueryResult<T> = {
  data: T[] | null
  error: DatabaseError | null
}

export type PilotMetricRecomputeResult = {
  data: {
    scorecard: ReturnType<typeof computePilotMetricSnapshots>["scorecard"]
    snapshotsWritten: number
    calculatedAt: string
  } | null
  error: DatabaseError | null
  missingTables: string[]
}

function isMissingTableError(error: DatabaseError | null): boolean {
  if (!error) return false
  return error.code === "42P01" || /does not exist|relation/i.test(error.message || "")
}

function isAllowedValue<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value)
}

function isAttemptOutcome(value: string): value is AttemptOutcome {
  return isAllowedValue(value, ATTEMPT_OUTCOMES)
}

function isReferralState(value: string): value is ReferralState {
  return isAllowedValue(value, REFERRAL_STATES)
}

function isPilotScopeSlaTier(value: string): value is PilotScopeSlaTier {
  return isAllowedValue(value, PILOT_SCOPE_SLA_TIERS)
}

function isServiceOperationalStatusCode(value: string): value is ServiceOperationalStatusCode {
  return isAllowedValue(value, SERVICE_OPERATIONAL_STATUS_CODES)
}

function isPilotDataDecayFatalErrorCategory(value: string): value is PilotDataDecayFatalErrorCategory {
  return isAllowedValue(value, PILOT_DATA_DECAY_FATAL_ERROR_CATEGORIES)
}

async function readRows<T>(
  tableName: string,
  query: () => Promise<QueryResult<T>>
): Promise<{ data: T[]; error: DatabaseError | null; missingTable: string | null }> {
  const { data, error } = await withCircuitBreaker(query)

  if (isMissingTableError(error)) {
    return { data: [], error: null, missingTable: tableName }
  }

  if (error) {
    return { data: [], error, missingTable: null }
  }

  return { data: data ?? [], error: null, missingTable: null }
}

export async function recomputePilotMetrics(
  supabase: PilotSupabaseClient,
  pilotCycleId: string,
  orgId: string
): Promise<PilotMetricRecomputeResult> {
  const missingTables: string[] = []

  const contactAttempts = await readRows(
    "pilot_contact_attempt_events",
    async () =>
      (await supabase
        .from("pilot_contact_attempt_events")
        .select("id, attempted_at, attempt_outcome, entity_key_hash")
        .eq("pilot_cycle_id", pilotCycleId)
        .eq("recorded_by_org_id", orgId)) as QueryResult<{
        id: string
        attempted_at: string
        attempt_outcome: Database["public"]["Tables"]["pilot_contact_attempt_events"]["Row"]["attempt_outcome"]
        entity_key_hash: string | null
      }>
  )

  if (contactAttempts.error) {
    return { data: null, error: contactAttempts.error, missingTables: [] }
  }
  if (contactAttempts.missingTable) missingTables.push(contactAttempts.missingTable)

  const referrals = await readRows(
    "pilot_referral_events",
    async () =>
      (await supabase
        .from("pilot_referral_events")
        .select("id, created_at, referral_state")
        .eq("pilot_cycle_id", pilotCycleId)
        .eq("source_org_id", orgId)) as QueryResult<{
        id: string
        created_at: string
        referral_state: Database["public"]["Tables"]["pilot_referral_events"]["Row"]["referral_state"]
      }>
  )

  if (referrals.error) {
    return { data: null, error: referrals.error, missingTables: [] }
  }
  if (referrals.missingTable) missingTables.push(referrals.missingTable)

  const connections = await readRows(
    "pilot_connection_events",
    async () =>
      (await supabase
        .from("pilot_connection_events")
        .select("connected_at, contact_attempt_event_id, referral_event_id")
        .eq("pilot_cycle_id", pilotCycleId)
        .eq("org_id", orgId)) as QueryResult<{
        connected_at: string
        contact_attempt_event_id: string | null
        referral_event_id: string | null
      }>
  )

  if (connections.error) {
    return { data: null, error: connections.error, missingTables: [] }
  }
  if (connections.missingTable) missingTables.push(connections.missingTable)

  const scopeServices = await readRows(
    "pilot_service_scope",
    async () =>
      (await supabase
        .from("pilot_service_scope")
        .select("service_id, sla_tier")
        .eq("pilot_cycle_id", pilotCycleId)
        .eq("org_id", orgId)) as QueryResult<{
        service_id: string
        sla_tier: Database["public"]["Tables"]["pilot_service_scope"]["Row"]["sla_tier"]
      }>
  )

  if (scopeServices.error) {
    return { data: null, error: scopeServices.error, missingTables: [] }
  }
  if (scopeServices.missingTable) missingTables.push(scopeServices.missingTable)

  const serviceStatusEvents = await readRows(
    "service_operational_status_events",
    async () =>
      (await supabase
        .from("service_operational_status_events")
        .select("service_id, checked_at, status_code")
        .eq("pilot_cycle_id", pilotCycleId)
        .eq("org_id", orgId)) as QueryResult<{
        service_id: string
        checked_at: string
        status_code: Database["public"]["Tables"]["service_operational_status_events"]["Row"]["status_code"]
      }>
  )

  if (serviceStatusEvents.error) {
    return { data: null, error: serviceStatusEvents.error, missingTables: [] }
  }
  if (serviceStatusEvents.missingTable) missingTables.push(serviceStatusEvents.missingTable)

  const dataDecayAudits = await readRows(
    "pilot_data_decay_audits",
    async () =>
      (await supabase
        .from("pilot_data_decay_audits")
        .select("audited_at, is_fatal, fatal_error_category")
        .eq("pilot_cycle_id", pilotCycleId)
        .eq("org_id", orgId)) as QueryResult<{
        audited_at: string
        is_fatal: boolean
        fatal_error_category: Database["public"]["Tables"]["pilot_data_decay_audits"]["Row"]["fatal_error_category"]
      }>
  )

  if (dataDecayAudits.error) {
    return { data: null, error: dataDecayAudits.error, missingTables: [] }
  }
  if (dataDecayAudits.missingTable) missingTables.push(dataDecayAudits.missingTable)

  const preferenceFitEvents = await readRows(
    "pilot_preference_fit_events",
    async () =>
      (await supabase
        .from("pilot_preference_fit_events")
        .select("recorded_at, preferred_via_careconnect")
        .eq("pilot_cycle_id", pilotCycleId)
        .eq("org_id", orgId)) as QueryResult<{
        recorded_at: string
        preferred_via_careconnect: boolean
      }>
  )

  if (preferenceFitEvents.error) {
    return { data: null, error: preferenceFitEvents.error, missingTables: [] }
  }
  if (preferenceFitEvents.missingTable) missingTables.push(preferenceFitEvents.missingTable)

  if (missingTables.length > 0) {
    return { data: null, error: null, missingTables: [...new Set(missingTables)] }
  }

  const normalizedContactAttempts = contactAttempts.data.flatMap((attempt) =>
    isAttemptOutcome(attempt.attempt_outcome)
      ? [
          {
            id: attempt.id,
            attempted_at: attempt.attempted_at,
            attempt_outcome: attempt.attempt_outcome,
            entity_key_hash: attempt.entity_key_hash,
          },
        ]
      : []
  )

  const normalizedReferrals = referrals.data.flatMap((referral) =>
    isReferralState(referral.referral_state)
      ? [
          {
            id: referral.id,
            created_at: referral.created_at,
            referral_state: referral.referral_state,
          },
        ]
      : []
  )

  const normalizedScopeServices = scopeServices.data.flatMap((service) =>
    isPilotScopeSlaTier(service.sla_tier)
      ? [
          {
            service_id: service.service_id,
            sla_tier: service.sla_tier,
          },
        ]
      : []
  )

  const normalizedServiceStatusEvents = serviceStatusEvents.data.flatMap((event) =>
    isServiceOperationalStatusCode(event.status_code)
      ? [
          {
            service_id: event.service_id,
            checked_at: event.checked_at,
            status_code: event.status_code,
          },
        ]
      : []
  )

  const normalizedDataDecayAudits = dataDecayAudits.data.flatMap((audit) => {
    if (
      audit.fatal_error_category !== null &&
      audit.fatal_error_category !== undefined &&
      !isPilotDataDecayFatalErrorCategory(audit.fatal_error_category)
    ) {
      return []
    }

    return [
      {
        audited_at: audit.audited_at,
        is_fatal: audit.is_fatal,
        fatal_error_category: audit.fatal_error_category,
      },
    ]
  })

  const calculatedAt = new Date().toISOString()
  const computed = computePilotMetricSnapshots(
    pilotCycleId,
    {
      contactAttempts: normalizedContactAttempts,
      referrals: normalizedReferrals,
      connections: connections.data,
      scopeServices: normalizedScopeServices,
      serviceStatusEvents: normalizedServiceStatusEvents,
      dataDecayAudits: normalizedDataDecayAudits,
      preferenceFitEvents: preferenceFitEvents.data,
    },
    calculatedAt
  )

  const inserted = await insertPilotMetricSnapshots(supabase, pilotCycleId, orgId, computed.snapshots, calculatedAt)
  if (inserted.missingTable) {
    return { data: null, error: null, missingTables: ["pilot_metric_snapshots"] }
  }
  if (inserted.error) {
    return { data: null, error: inserted.error, missingTables: [] }
  }

  return {
    data: {
      scorecard: computed.scorecard,
      snapshotsWritten: inserted.data?.length ?? computed.snapshots.length,
      calculatedAt,
    },
    error: null,
    missingTables: [],
  }
}
