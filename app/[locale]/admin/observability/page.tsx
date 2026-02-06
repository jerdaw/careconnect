/**
 * Observability Dashboard
 *
 * Real-time system health monitoring for platform admins.
 *
 * Features:
 * - Circuit breaker status (CLOSED/OPEN/HALF_OPEN)
 * - Performance metrics (p50/p95/p99 latency)
 * - Recent incidents (last 24h)
 * - System health summary
 *
 * Access: Admin-only (enforced via middleware)
 */

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSupabaseBreakerStats } from "@/lib/resilience/supabase-breaker"
import { getMetrics } from "@/lib/performance/metrics"
import { createClient } from "@/utils/supabase/server"
import { isUserAdmin } from "@/lib/auth/authorization"
import { CircuitBreakerCard } from "@/components/observability/CircuitBreakerCard"
import { PerformanceCharts } from "@/components/observability/PerformanceCharts"
import { HealthSummary } from "@/components/observability/HealthSummary"
import { RefreshButton } from "@/components/observability/RefreshButton"
import { AutoRefresh } from "@/components/observability/AutoRefresh"
import { SLOComplianceCard } from "@/components/observability/SLOComplianceCard"
import { SLODisclaimerBanner } from "@/components/observability/SLODisclaimerBanner"
import { getSLOComplianceSummary } from "@/lib/observability/slo-tracker"

export const metadata: Metadata = {
  title: "Observability Dashboard | Admin",
  description: "Real-time system health monitoring",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ObservabilityPage() {
  // Admin-only access
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/admin/observability")
  }

  // Check admin status
  const isAdmin = await isUserAdmin(supabase, user.id)
  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Fetch current system state
  const circuitBreakerStats = getSupabaseBreakerStats()
  const performanceMetrics = getMetrics()
  const sloCompliance = getSLOComplianceSummary()

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Observability Dashboard</h1>
          <p className="text-muted-foreground">Real-time system health and performance monitoring</p>
        </div>
        <RefreshButton />
      </div>

      {/* SLO Provisional Disclaimer */}
      <SLODisclaimerBanner />

      {/* SLO Compliance */}
      <SLOComplianceCard compliance={sloCompliance} />

      {/* System Health Summary */}
      <HealthSummary circuitBreaker={circuitBreakerStats} metrics={performanceMetrics} />

      {/* Circuit Breaker Status */}
      <CircuitBreakerCard stats={circuitBreakerStats} />

      {/* Performance Metrics */}
      <PerformanceCharts metrics={performanceMetrics} />

      {/* Auto-refresh every 60 seconds */}
      <AutoRefresh />
    </div>
  )
}
