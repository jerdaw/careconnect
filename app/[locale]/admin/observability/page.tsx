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
import { getTranslations } from "next-intl/server"
import { redirect } from "@/i18n/routing"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Admin.observability.meta" })

  return {
    title: t("title"),
    description: t("description"),
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ObservabilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations("Admin.observability")
  // Admin-only access
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const currentUser = user

  if (!currentUser) {
    return redirect({
      href: {
        pathname: "/login",
        query: {
          next: "/admin/observability",
        },
      },
      locale,
    })
  }

  // Check admin status
  const isAdmin = await isUserAdmin(supabase, currentUser.id)
  if (!isAdmin) {
    return redirect({ href: "/dashboard", locale })
  }

  // Fetch current system state
  const circuitBreakerStats = getSupabaseBreakerStats()
  const performanceMetrics = getMetrics()
  const sloCompliance = getSLOComplianceSummary()

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
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
