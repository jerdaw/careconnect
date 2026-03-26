/**
 * SLO (Service Level Objective) Tracker
 *
 * Tracks uptime, error budget, and latency SLOs in-memory.
 * Uses 30-day sliding window for compliance calculations.
 */

import { SLO_TARGETS } from "@/lib/config/slo-targets"
import { logger } from "@/lib/logger"
import { getMetrics } from "@/lib/performance/metrics"

export interface UptimeDataPoint {
  timestamp: number
  success: boolean
}

export interface SLOComplianceSummary {
  uptime: {
    actual: number // 0-1
    target: number // 0-1
    compliant: boolean
    totalChecks: number
    successfulChecks: number
  }
  errorBudget: {
    remaining: number // 0-1 (percentage of budget left)
    consumed: number // 0-1 (percentage of budget used)
    exhausted: boolean
    warningThreshold: number // 0.5 (50% consumed)
  }
  latency: {
    actualP95: number | null // milliseconds
    target: number // milliseconds
    compliant: boolean
    hasData: boolean
  }
  overall: {
    compliant: boolean
    violations: string[]
  }
}

/**
 * In-memory uptime history
 * Stores last 30 days of uptime checks
 */
const uptimeHistory: UptimeDataPoint[] = []

/**
 * Maximum retention period (30 days in milliseconds)
 */
const MAX_RETENTION_MS = SLO_TARGETS.windowDays * 24 * 60 * 60 * 1000

/**
 * Prune old uptime data points outside the retention window
 */
function pruneOldData(): void {
  const cutoffTime = Date.now() - MAX_RETENTION_MS
  const startLength = uptimeHistory.length

  // Remove old data points
  while (uptimeHistory.length > 0 && uptimeHistory[0]!.timestamp < cutoffTime) {
    uptimeHistory.shift()
  }

  if (startLength > uptimeHistory.length) {
    logger.info("[SLO Tracker] Pruned old data points", { count: startLength - uptimeHistory.length })
  }
}

/**
 * Record an uptime event (health check)
 * @param success - Whether the service was healthy
 */
export function recordUptimeEvent(success: boolean): void {
  uptimeHistory.push({
    timestamp: Date.now(),
    success,
  })

  // Prune old data
  pruneOldData()

  // Limit array size (safety: 30 days * 24h * 12 checks/hour = ~8640 max)
  const MAX_SIZE = 10000
  if (uptimeHistory.length > MAX_SIZE) {
    uptimeHistory.splice(0, uptimeHistory.length - MAX_SIZE)
  }
}

/**
 * Calculate actual uptime percentage
 * @returns Uptime as decimal (0-1), or null if no data
 */
export function calculateUptimePercentage(): number | null {
  pruneOldData()

  if (uptimeHistory.length === 0) {
    return null
  }

  const successfulChecks = uptimeHistory.filter((dp) => dp.success).length
  return successfulChecks / uptimeHistory.length
}

/**
 * Calculate error budget remaining
 * @returns Remaining budget as decimal (0-1), or null if no data
 */
export function calculateErrorBudgetRemaining(): number | null {
  const actualUptime = calculateUptimePercentage()
  if (actualUptime === null) {
    return null
  }

  const errorBudget = SLO_TARGETS.errorBudget

  // Calculate actual error rate
  const actualErrorRate = 1 - actualUptime

  // Calculate budget remaining
  const budgetConsumed = actualErrorRate / errorBudget
  const budgetRemaining = 1 - budgetConsumed

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, budgetRemaining))
}

/**
 * Check if latency SLO is met
 * @param p95Latency - Optional p95 latency to check (otherwise fetches from metrics)
 * @returns Compliance status
 */
export function checkLatencySLO(p95Latency?: number): {
  compliant: boolean
  actualP95: number | null
  target: number
  hasData: boolean
} {
  const target = SLO_TARGETS.latencyP95Ms

  // Use provided value or fetch from metrics
  let actualP95: number | null = null
  if (p95Latency !== undefined) {
    actualP95 = p95Latency
  } else {
    const metrics = getMetrics()
    // Find max p95 across all operations
    const p95Values = Object.values(metrics.operations).map((op) => op.p95)
    if (p95Values.length > 0) {
      actualP95 = Math.max(...p95Values)
    }
  }

  const hasData = actualP95 !== null
  const compliant = !hasData || (actualP95 !== null && actualP95 <= target)

  return {
    compliant,
    actualP95,
    target,
    hasData,
  }
}

/**
 * Get full SLO compliance summary
 * @returns Comprehensive SLO status report
 */
export function getSLOComplianceSummary(): SLOComplianceSummary {
  pruneOldData()

  // Uptime calculation
  const actualUptime = calculateUptimePercentage()
  const totalChecks = uptimeHistory.length
  const successfulChecks = uptimeHistory.filter((dp) => dp.success).length
  const uptimeCompliant = actualUptime === null || actualUptime >= SLO_TARGETS.uptime

  // Error budget calculation
  const errorBudgetRemaining = calculateErrorBudgetRemaining()
  const errorBudgetConsumed = errorBudgetRemaining === null ? 0 : 1 - errorBudgetRemaining
  const errorBudgetExhausted = errorBudgetRemaining !== null && errorBudgetRemaining <= 0

  // Latency check
  const latencyCheck = checkLatencySLO()

  // Overall compliance
  const violations: string[] = []
  if (!uptimeCompliant) {
    violations.push("Uptime below target")
  }
  if (errorBudgetExhausted) {
    violations.push("Error budget exhausted")
  }
  if (!latencyCheck.compliant && latencyCheck.hasData) {
    violations.push("Latency p95 exceeds target")
  }

  const overallCompliant = violations.length === 0

  return {
    uptime: {
      actual: actualUptime ?? 1.0,
      target: SLO_TARGETS.uptime,
      compliant: uptimeCompliant,
      totalChecks,
      successfulChecks,
    },
    errorBudget: {
      remaining: errorBudgetRemaining ?? 1.0,
      consumed: errorBudgetConsumed,
      exhausted: errorBudgetExhausted,
      warningThreshold: 0.5,
    },
    latency: {
      actualP95: latencyCheck.actualP95,
      target: latencyCheck.target,
      compliant: latencyCheck.compliant,
      hasData: latencyCheck.hasData,
    },
    overall: {
      compliant: overallCompliant,
      violations,
    },
  }
}

/**
 * Get uptime history for debugging
 */
export function getUptimeHistory(): UptimeDataPoint[] {
  return [...uptimeHistory]
}

/**
 * Clear uptime history (for testing)
 */
export function clearUptimeHistory(): void {
  uptimeHistory.length = 0
}
