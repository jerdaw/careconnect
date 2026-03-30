import { createClient } from "@/utils/supabase/server"
import { getTranslations } from "next-intl/server"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { Card } from "@/components/ui/card"
import { ThumbsUp, CheckCircle2, ShieldCheck, MessageSquare, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { logger } from "@/lib/logger"

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
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-3">{icon}</div>
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
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
  const supabase = await createClient()
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  try {
    const [
      helpfulYesResult,
      helpfulNoResult,
      totalIssuesResult,
      resolvedIssuesResult,
      totalServicesResult,
      verifiedRecentlyResult,
    ] = await withCircuitBreaker(async () =>
      Promise.all([
        supabase.from("feedback").select("*", { count: "exact", head: true }).eq("feedback_type", "helpful_yes"),
        supabase.from("feedback").select("*", { count: "exact", head: true }).eq("feedback_type", "helpful_no"),
        supabase.from("feedback").select("*", { count: "exact", head: true }).eq("feedback_type", "issue"),
        supabase
          .from("feedback")
          .select("*", { count: "exact", head: true })
          .eq("feedback_type", "issue")
          .eq("status", "resolved"),
        supabase.from("services").select("*", { count: "exact", head: true }).is("deleted_at", null),
        supabase
          .from("services")
          .select("*", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("last_verified", ninetyDaysAgo.toISOString()),
      ])
    )

    if (helpfulYesResult.error) throw helpfulYesResult.error
    if (helpfulNoResult.error) throw helpfulNoResult.error
    if (totalIssuesResult.error) throw totalIssuesResult.error
    if (resolvedIssuesResult.error) throw resolvedIssuesResult.error
    if (totalServicesResult.error) throw totalServicesResult.error
    if (verifiedRecentlyResult.error) throw verifiedRecentlyResult.error

    return {
      degraded: false,
      helpfulYes: helpfulYesResult.count || 0,
      helpfulNo: helpfulNoResult.count || 0,
      totalIssues: totalIssuesResult.count || 0,
      resolvedIssues: resolvedIssuesResult.count || 0,
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
    <main id="main-content" className="flex min-h-screen flex-col bg-stone-50 dark:bg-neutral-950">
      <Header />

      <Section className="pt-32 pb-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="heading-display mb-4 text-4xl font-bold md:text-5xl">{t("title")}</h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">{t("subtitle")}</p>
        </div>
      </Section>

      <Section className="py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="heading-display mb-6 text-2xl font-bold">{t("metricsTitle")}</h2>

          {metrics.degraded && (
            <Alert className="mb-6">
              <AlertDescription>{t("metricsTemporarilyUnavailable")}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title={t("satisfactionTitle")}
              value={`${helpfulRate}%`}
              description={t("satisfactionDesc", { count: totalHelpful })}
              icon={<ThumbsUp className="text-primary-600 h-6 w-6" />}
            />

            <MetricCard
              title={t("issuesResolvedTitle")}
              value={safeResolvedIssues}
              description={t("issuesResolvedDesc", { total: safeTotalIssues })}
              icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
            />

            <MetricCard
              title={t("servicesVerifiedTitle")}
              value={metrics.verifiedRecently}
              description={t("servicesVerifiedDesc", { total: metrics.totalServices })}
              icon={<ShieldCheck className="h-6 w-6 text-blue-600" />}
            />

            <MetricCard
              title={t("feedbackTitle")}
              value={totalFeedback || 0}
              description={t("feedbackDesc")}
              icon={<MessageSquare className="h-6 w-6 text-purple-600" />}
            />
          </div>
        </div>
      </Section>

      <Section className="bg-white py-12 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="heading-display mb-6 text-2xl font-bold">{t("privacyTitle")}</h2>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-neutral-600 dark:text-neutral-300">{t("privacyText")}</p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm">{t("noTracking")}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm">{t("noCookies")}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm">{t("voluntaryFeedback")}</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="py-12">
        <div className="mx-auto max-w-4xl text-center">
          <TrendingUp className="text-primary-500 mx-auto mb-4 h-12 w-12" />
          <h2 className="heading-display mb-4 text-2xl font-bold">{t("commitmentTitle")}</h2>
          <p className="text-neutral-600 dark:text-neutral-300">{t("commitmentText")}</p>
        </div>
      </Section>

      <Footer />
    </main>
  )
}
