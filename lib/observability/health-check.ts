import { getSupabaseBreakerStats } from "@/lib/resilience/supabase-breaker"
import { getSupabaseClient, hasSupabaseCredentials, SupabaseNotConfiguredError } from "@/lib/supabase"
import { getMetrics } from "@/lib/performance/metrics"
import { env } from "@/lib/env"
import { getSLOComplianceSummary } from "@/lib/observability/slo-tracker"
import { sendSLOViolationAlert } from "@/lib/integrations/slack"
import { MIN_SLO_ALERT_SAMPLES } from "@/lib/config/slo-targets"
import { logger } from "@/lib/logger"

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  version: string
  checks: {
    database: {
      status: "up" | "down" | "degraded"
      latencyMs?: number
      error?: string
    }
    circuitBreaker: {
      enabled: boolean
      state: string
      stats: ReturnType<typeof getSupabaseBreakerStats>
    }
    performance?: {
      tracking: boolean
      metrics: ReturnType<typeof getMetrics>
    }
    slo?: ReturnType<typeof getSLOComplianceSummary>
  }
}

export async function checkDatabase(): Promise<HealthCheckResponse["checks"]["database"]> {
  try {
    if (!hasSupabaseCredentials()) {
      return {
        status: "down",
        error: "Supabase credentials not configured",
      }
    }

    const startTime = performance.now()
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("services").select("id").limit(1)
    const latencyMs = Math.round(performance.now() - startTime)

    if (error) {
      return {
        status: "down",
        latencyMs,
        error: error.message,
      }
    }

    if (latencyMs > 1000) {
      return {
        status: "degraded",
        latencyMs,
      }
    }

    return {
      status: "up",
      latencyMs,
    }
  } catch (error) {
    return {
      status: "down",
      error:
        error instanceof SupabaseNotConfiguredError
          ? "Supabase credentials not configured"
          : error instanceof Error
            ? error.message
            : String(error),
    }
  }
}

export async function checkAndAlertSLOViolations(
  compliance: ReturnType<typeof getSLOComplianceSummary>
): Promise<void> {
  try {
    const timestamp = Date.now()
    const hasEnoughAvailabilitySamples = compliance.uptime.totalChecks >= MIN_SLO_ALERT_SAMPLES

    if (hasEnoughAvailabilitySamples && !compliance.uptime.compliant) {
      void sendSLOViolationAlert({
        type: "uptime",
        severity: "critical",
        actual: compliance.uptime.actual,
        target: compliance.uptime.target,
        timestamp,
        message: `Uptime ${(compliance.uptime.actual * 100).toFixed(2)}% below target ${(compliance.uptime.target * 100).toFixed(2)}%`,
      })
    }

    if (hasEnoughAvailabilitySamples && compliance.errorBudget.exhausted) {
      void sendSLOViolationAlert({
        type: "error-budget",
        severity: "critical",
        actual: compliance.errorBudget.remaining,
        target: 0,
        timestamp,
        message: "Error budget exhausted - reduce incident rate",
      })
    } else if (
      hasEnoughAvailabilitySamples &&
      compliance.errorBudget.consumed >= compliance.errorBudget.warningThreshold
    ) {
      void sendSLOViolationAlert({
        type: "error-budget",
        severity: "warning",
        actual: compliance.errorBudget.remaining,
        target: compliance.errorBudget.warningThreshold,
        timestamp,
        message: `Error budget ${(compliance.errorBudget.consumed * 100).toFixed(1)}% consumed`,
      })
    }

    if (compliance.latency.hasData && !compliance.latency.compliant && compliance.latency.actualP95 !== null) {
      void sendSLOViolationAlert({
        type: "latency",
        severity: "critical",
        actual: compliance.latency.actualP95,
        target: compliance.latency.target,
        timestamp,
        message: `p95 latency ${compliance.latency.actualP95}ms exceeds target ${compliance.latency.target}ms`,
      })
    }
  } catch (error) {
    logger.error("Failed to check/send SLO violation alerts", {
      component: "health-check",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function getHealthSnapshot() {
  const timestamp = new Date().toISOString()
  const version = process.env.APP_VERSION || process.env.npm_package_version || "unknown"
  const databaseCheck = await checkDatabase()
  const circuitBreakerStats = getSupabaseBreakerStats()
  const sloCompliance = getSLOComplianceSummary()

  let overallStatus: HealthCheckResponse["status"] = "healthy"
  if (databaseCheck.status === "down" || circuitBreakerStats.state === "OPEN") {
    overallStatus = "unhealthy"
  } else if (databaseCheck.status === "degraded") {
    overallStatus = "degraded"
  }

  const basicResponse = {
    status: overallStatus,
    timestamp,
    version,
  }

  const performanceMetrics = env.NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING ? getMetrics() : undefined

  const detailedResponse: HealthCheckResponse = {
    ...basicResponse,
    checks: {
      database: databaseCheck,
      circuitBreaker: {
        enabled: circuitBreakerStats.enabled,
        state: circuitBreakerStats.state,
        stats: circuitBreakerStats,
      },
      ...(performanceMetrics && {
        performance: {
          tracking: true,
          metrics: performanceMetrics,
        },
      }),
      slo: sloCompliance,
    },
  }

  return {
    basicResponse,
    detailedResponse,
    overallStatus,
    isHealthy: databaseCheck.status === "up" && circuitBreakerStats.state !== "OPEN",
    sloCompliance,
  }
}
