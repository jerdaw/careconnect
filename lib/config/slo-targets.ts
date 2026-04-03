/**
 * SLO (Service Level Objective) Targets Configuration
 *
 * PROVISIONAL STATUS: These targets use recommended defaults from the SLO Decision Guide.
 * See: docs/planning/v18-0-phase-3-slo-decision-guide.md
 *
 * Review and adjust based on production data and business requirements.
 */

export interface SLOTargets {
  /** Target uptime percentage (0-1) */
  uptime: number
  /** Target p95 latency in milliseconds */
  latencyP95Ms: number
  /** Allowed error budget as percentage (0-1) */
  errorBudget: number
  /** Measurement window in days */
  windowDays: number
}

/**
 * SLO status flag
 * - "PROVISIONAL": Using recommended defaults, awaiting user review
 * - "CONFIRMED": User-approved targets
 */
export type SLOStatus = "PROVISIONAL" | "CONFIRMED"

export const SLO_STATUS: SLOStatus = "PROVISIONAL"

/**
 * Production SLO Targets (PROVISIONAL)
 *
 * Defaults based on "Tier B: Realistic" recommendations:
 * - Uptime: 99.5% (3h 36m downtime/month)
 * - Latency: p95 < 800ms (matches v18.0 roadmap target)
 * - Error Budget: 0.5% (derived from uptime target)
 * - Window: 30 days (industry standard)
 */
export const SLO_TARGETS: SLOTargets = {
  uptime: 0.995, // 99.5%
  latencyP95Ms: 800, // 800ms p95
  errorBudget: 0.005, // 0.5%
  windowDays: 30,
}

/**
 * Minimum number of health-check samples required before uptime/error-budget
 * violations are actionable enough to alert on. This avoids noisy false alarms
 * during fresh deploys and process restarts.
 */
export const MIN_SLO_ALERT_SAMPLES = 20

/**
 * Calculate allowed downtime budget based on uptime target
 * @param uptimeTarget - Target uptime (0-1)
 * @param windowDays - Measurement window in days
 * @returns Downtime budget in minutes
 */
export function calculateDowntimeBudget(
  uptimeTarget: number = SLO_TARGETS.uptime,
  windowDays: number = SLO_TARGETS.windowDays
): number {
  const totalMinutes = windowDays * 24 * 60
  const downtimePercentage = 1 - uptimeTarget
  return totalMinutes * downtimePercentage
}

/**
 * Get SLO summary for display
 */
export function getSLOSummary() {
  const downtimeBudget = calculateDowntimeBudget()
  const hours = Math.floor(downtimeBudget / 60)
  const minutes = Math.round(downtimeBudget % 60)

  return {
    status: SLO_STATUS,
    targets: SLO_TARGETS,
    downtimeBudget: {
      minutes: downtimeBudget,
      formatted: `${hours}h ${minutes}m`,
    },
    description: {
      uptime: `${(SLO_TARGETS.uptime * 100).toFixed(2)}% uptime`,
      latency: `p95 < ${SLO_TARGETS.latencyP95Ms}ms`,
      errorBudget: `${(SLO_TARGETS.errorBudget * 100).toFixed(2)}% error budget`,
    },
  }
}
