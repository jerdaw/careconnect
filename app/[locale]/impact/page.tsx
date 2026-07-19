import { createClient } from "@/utils/supabase/server"
import { getTranslations } from "next-intl/server"
import { StaticPageShell } from "@/components/layout/StaticPageShell"
import { Card } from "@/components/ui/card"
import { ThumbsUp, CheckCircle2, ShieldCheck, MessageSquare, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { logger } from "@/lib/logger"
import { getPublicFreshnessCutoff } from "@/lib/public-service-governance"

export const revalidate = 3600 // Revalidate every hour

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

function MetricCard({ title, value, description, icon }: MetricCardProps) {
  return (
    <Card
      padding="none"
      className="border-neutral-200/75 bg-white/86 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10"
    >
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-200 rounded-xl p-3 ring-1 ring-black/5 dark:ring-white/10">
            {icon}
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">{value}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface ImpactMetrics {
  degraded: boolean
  helpfulNo: number
  helpfulYes: number
  resolvedIssues: number
  totalIssues: number
  totalServices: number
  verifiedRecently: number
}

async function loadImpactMetrics(): Promise<ImpactMetrics> {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  try {
    const supabase = await createClient()
    const [feedbackResult, totalServicesResult, verifiedRecentlyResult] = await withCircuitBreaker(async () =>
      Promise.all([
        supabase
          .from("feedback_aggregations")
          .select("helpful_yes_count, helpful_no_count, total_issues_count, resolved_issues_count"),
        supabase
          .from("services_public")
          .select("id", { count: "exact", head: true })
          .gte("last_verified", getPublicFreshnessCutoff()),
        supabase
          .from("services_public")
          .select("id", { count: "exact", head: true })
          .gte("last_verified", ninetyDaysAgo.toISOString()),
      ])
    )

    if (feedbackResult.error) throw feedbackResult.error
    if (totalServicesResult.error) throw totalServicesResult.error
    if (verifiedRecentlyResult.error) throw verifiedRecentlyResult.error

    const feedbackTotals = (feedbackResult.data || []).reduce(
      (totals, row) => ({
        helpfulYes: totals.helpfulYes + (row.helpful_yes_count || 0),
        helpfulNo: totals.helpfulNo + (row.helpful_no_count || 0),
        totalIssues: totals.totalIssues + (row.total_issues_count || 0),
        resolvedIssues: totals.resolvedIssues + (row.resolved_issues_count || 0),
      }),
      { helpfulYes: 0, helpfulNo: 0, totalIssues: 0, resolvedIssues: 0 }
    )

    return {
      degraded: false,
      ...feedbackTotals,
      totalServices: totalServicesResult.count || 0,
      verifiedRecently: verifiedRecentlyResult.count || 0,
    }
  } catch (error) {
    logger.warn("Failed to load impact metrics", {
      component: "ImpactPage",
      error: error instanceof Error ? error.message : String(error),
    })

    return {
      degraded: true,
      helpfulYes: 0,
      helpfulNo: 0,
      totalIssues: 0,
      resolvedIssues: 0,
      totalServices: 0,
      verifiedRecently: 0,
    }
  }
}

export default async function ImpactPage() {
  const t = await getTranslations("Impact")
  const metrics = await loadImpactMetrics()

  const safeHelpfulYes = metrics.helpfulYes
  const safeHelpfulNo = metrics.helpfulNo
  const safeTotalIssues = metrics.totalIssues
  const safeResolvedIssues = metrics.resolvedIssues

  const totalHelpful = safeHelpfulYes + safeHelpfulNo
  const helpfulRate = totalHelpful > 0 ? Math.round((safeHelpfulYes / totalHelpful) * 100) : 0
  const totalFeedback = totalHelpful + safeTotalIssues

  return (
    <StaticPageShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("subtitle")}
      icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
      maxWidth="wide"
      articleClassName="border-0 bg-transparent p-0 shadow-none ring-0 dark:bg-transparent dark:ring-0"
    >
      <div className="space-y-8">
        <section aria-labelledby="impact-metrics-heading">
          <h2
            id="impact-metrics-heading"
            className="heading-display mb-6 text-2xl font-bold text-neutral-950 dark:text-white"
          >
            {t("metricsTitle")}
          </h2>

          {metrics.degraded && (
            <Alert className="mb-6 border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
              <AlertDescription>{t("metricsTemporarilyUnavailable")}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title={t("satisfactionTitle")}
              value={`${helpfulRate}%`}
              description={t("satisfactionDesc", { count: totalHelpful })}
              icon={<ThumbsUp className="h-6 w-6" aria-hidden="true" />}
            />

            <MetricCard
              title={t("issuesResolvedTitle")}
              value={safeResolvedIssues}
              description={t("issuesResolvedDesc", { total: safeTotalIssues })}
              icon={<CheckCircle2 className="h-6 w-6" aria-hidden="true" />}
            />

            <MetricCard
              title={t("servicesVerifiedTitle")}
              value={metrics.verifiedRecently}
              description={t("servicesVerifiedDesc", { total: metrics.totalServices })}
              icon={<ShieldCheck className="h-6 w-6" aria-hidden="true" />}
            />

            <MetricCard
              title={t("feedbackTitle")}
              value={totalFeedback || 0}
              description={t("feedbackDesc")}
              icon={<MessageSquare className="h-6 w-6" aria-hidden="true" />}
            />
          </div>
        </section>

        <section
          aria-labelledby="impact-privacy-heading"
          className="rounded-2xl border border-neutral-200/75 bg-white/86 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ring-1 ring-white/70 backdrop-blur-md md:p-8 dark:border-white/10 dark:bg-white/[0.06] dark:ring-white/10"
        >
          <h2
            id="impact-privacy-heading"
            className="heading-display mb-4 text-2xl font-bold text-neutral-950 dark:text-white"
          >
            {t("privacyTitle")}
          </h2>
          <p className="max-w-3xl text-neutral-700 dark:text-neutral-300">{t("privacyText")}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[t("noTracking"), t("noCookies"), t("voluntaryFeedback")].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-neutral-200/70 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                <span className="text-sm text-neutral-800 dark:text-neutral-200">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="impact-commitment-heading"
          className="rounded-2xl border border-neutral-200/75 bg-white/74 p-6 text-center shadow-[0_14px_34px_rgba(15,23,42,0.04)] ring-1 ring-white/70 backdrop-blur-md md:p-8 dark:border-white/10 dark:bg-white/[0.05] dark:ring-white/10"
        >
          <TrendingUp className="text-accent-700 dark:text-accent-300 mx-auto mb-4 h-10 w-10" aria-hidden="true" />
          <h2
            id="impact-commitment-heading"
            className="heading-display mb-4 text-2xl font-bold text-neutral-950 dark:text-white"
          >
            {t("commitmentTitle")}
          </h2>
          <p className="mx-auto max-w-3xl text-neutral-700 dark:text-neutral-300">{t("commitmentText")}</p>
        </section>
      </div>
    </StaticPageShell>
  )
}
