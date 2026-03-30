import type { User } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { logger } from "@/lib/logger"

type AnalyticsEventType = "click_call" | "click_website" | "view_detail"

export interface OverviewAnalyticsEvent {
  created_at: string
  event_type: string
}

export interface OverviewServiceRecord {
  last_verified: string | null
  verification_status: string | null
}

export interface OverviewMetricSummary {
  change: number
  current: number
  previous: number
}

export interface DashboardOverviewMetrics {
  dataQualityAvailable: false
  pendingUpdates: number
  referrals: OverviewMetricSummary
  servicesNeedingVerification: number
  servicesUpToDate: {
    current: number
    total: number
  }
  totalViews: OverviewMetricSummary
}

export interface DashboardOverviewResult {
  degraded: boolean
  metrics: DashboardOverviewMetrics
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

const TRACKED_REFERRAL_EVENTS = new Set<AnalyticsEventType>(["click_call", "click_website"])
const TRACKED_VIEW_EVENTS = new Set<AnalyticsEventType>(["view_detail"])
const VERIFIED_STATUSES = new Set(["L1", "L2", "L3"])

function buildEmptyMetricSummary(): OverviewMetricSummary {
  return {
    current: 0,
    previous: 0,
    change: 0,
  }
}

export function buildEmptyDashboardOverviewMetrics(): DashboardOverviewMetrics {
  return {
    totalViews: buildEmptyMetricSummary(),
    referrals: buildEmptyMetricSummary(),
    servicesUpToDate: {
      current: 0,
      total: 0,
    },
    servicesNeedingVerification: 0,
    pendingUpdates: 0,
    dataQualityAvailable: false,
  }
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }

  return Math.round(((current - previous) / previous) * 100)
}

function buildMetricSummary(
  events: OverviewAnalyticsEvent[],
  trackedTypes: Set<AnalyticsEventType>,
  currentWindowStart: number,
  previousWindowStart: number
): OverviewMetricSummary {
  let current = 0
  let previous = 0

  for (const event of events) {
    if (!trackedTypes.has(event.event_type as AnalyticsEventType)) {
      continue
    }

    const timestamp = Date.parse(event.created_at)
    if (Number.isNaN(timestamp)) {
      continue
    }

    if (timestamp >= currentWindowStart) {
      current += 1
    } else if (timestamp >= previousWindowStart) {
      previous += 1
    }
  }

  return {
    current,
    previous,
    change: calculatePercentChange(current, previous),
  }
}

export function buildDashboardOverviewMetrics(
  services: OverviewServiceRecord[],
  events: OverviewAnalyticsEvent[],
  pendingUpdates: number,
  now = new Date()
): DashboardOverviewMetrics {
  const nowMs = now.getTime()
  const currentWindowStart = nowMs - THIRTY_DAYS_MS
  const previousWindowStart = nowMs - THIRTY_DAYS_MS * 2
  const verifiedWindowStart = nowMs - NINETY_DAYS_MS

  let upToDateCount = 0
  let staleCount = 0

  for (const service of services) {
    const verifiedAt = service.last_verified ? Date.parse(service.last_verified) : Number.NaN
    const hasRecentVerification = !Number.isNaN(verifiedAt) && verifiedAt >= verifiedWindowStart
    const needsVerification = Number.isNaN(verifiedAt) || verifiedAt < currentWindowStart

    if (VERIFIED_STATUSES.has(service.verification_status ?? "") && hasRecentVerification) {
      upToDateCount += 1
    }

    if (needsVerification) {
      staleCount += 1
    }
  }

  return {
    totalViews: buildMetricSummary(events, TRACKED_VIEW_EVENTS, currentWindowStart, previousWindowStart),
    referrals: buildMetricSummary(events, TRACKED_REFERRAL_EVENTS, currentWindowStart, previousWindowStart),
    servicesUpToDate: {
      current: upToDateCount,
      total: services.length,
    },
    servicesNeedingVerification: staleCount,
    pendingUpdates,
    dataQualityAvailable: false,
  }
}

export async function loadDashboardOverviewMetrics(
  supabase: SupabaseClient<Database>,
  user: Pick<User, "email" | "id">
): Promise<DashboardOverviewResult> {
  const fallback = {
    degraded: true,
    metrics: buildEmptyDashboardOverviewMetrics(),
  } satisfies DashboardOverviewResult

  try {
    const membershipResult = await withCircuitBreaker(async () =>
      supabase.from("organization_members").select("organization_id").eq("user_id", user.id)
    )

    if (membershipResult.error) {
      throw membershipResult.error
    }

    const organizationIds = (membershipResult.data || []).map((membership) => membership.organization_id)

    if (organizationIds.length === 0) {
      return {
        degraded: false,
        metrics: buildEmptyDashboardOverviewMetrics(),
      }
    }

    const [servicesResult, eventsResult, updateRequestsResult] = await withCircuitBreaker(async () =>
      Promise.all([
        supabase
          .from("services")
          .select("verification_status, last_verified")
          .in("org_id", organizationIds)
          .is("deleted_at", null),
        supabase
          .from("analytics_events")
          .select(
            `
            event_type,
            created_at,
            services!inner(org_id)
          `
          )
          .gte("created_at", new Date(Date.now() - THIRTY_DAYS_MS * 2).toISOString())
          .in("services.org_id", organizationIds),
        user.email
          ? supabase
              .from("service_update_requests")
              .select("*", { count: "exact", head: true })
              .eq("requested_by", user.email)
              .eq("status", "pending")
          : Promise.resolve({ count: 0, data: null, error: null }),
      ])
    )

    if (servicesResult.error) throw servicesResult.error
    if (eventsResult.error) throw eventsResult.error
    if (updateRequestsResult.error) throw updateRequestsResult.error

    return {
      degraded: false,
      metrics: buildDashboardOverviewMetrics(
        (servicesResult.data || []) as OverviewServiceRecord[],
        (eventsResult.data || []) as OverviewAnalyticsEvent[],
        updateRequestsResult.count || 0
      ),
    }
  } catch (error) {
    logger.warn("Failed to load dashboard overview metrics", {
      component: "DashboardOverviewMetrics",
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return fallback
  }
}
