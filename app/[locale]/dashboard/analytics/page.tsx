import { createClient } from "@/utils/supabase/server"
import { AnalyticsCard } from "@/components/dashboard/AnalyticsCard"
import { getTranslations } from "next-intl/server"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"
import { Card } from "@/components/ui/card"

interface PartnerServiceAnalytics {
  service_id: string
  name: string
  org_id: string
  verification_level: string
  helpful_yes_count: number
  helpful_no_count: number
  open_issues_count: number
  last_feedback_at: string | null
  helpfulness_percentage: number | null
}

export default async function PartnerAnalyticsPage() {
  const t = await getTranslations("Analytics")
  const supabase = await createClient()

  // ==========================================================================
  // RLS-FIRST APPROACH: All queries automatically filtered by organization
  // ==========================================================================
  // The feedback and services tables have RLS policies that automatically
  // filter results to only show data for the authenticated user's organization.
  // No explicit org_id filters are needed in these queries.
  // ==========================================================================

  // Fetch partner-specific service analytics using the new view
  // This view automatically respects RLS from the services table
  const { data: serviceAnalyticsRaw } = await supabase
    .from("partner_service_analytics")
    .select("*")
    .order("last_feedback_at", { ascending: false, nullsFirst: false })

  const serviceAnalytics = (serviceAnalyticsRaw as unknown as PartnerServiceAnalytics[]) || []

  // Count total feedback for this partner's services (RLS filters automatically)
  const { count: totalFeedback } = await supabase.from("feedback").select("*", { count: "exact", head: true })

  const { count: totalYes } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("feedback_type", "helpful_yes")

  // Count partner's services (RLS filters automatically)
  const { count: totalServicesCount } = await supabase.from("services").select("*", { count: "exact", head: true })

  // Calculate stale services (no feedback in 90 days)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const servicesWithRecentFeedback = serviceAnalytics.filter(
    (s) => s.last_feedback_at && new Date(s.last_feedback_at) > ninetyDaysAgo
  ).length

  const stalePercent = totalServicesCount
    ? Math.round(((totalServicesCount - servicesWithRecentFeedback) / totalServicesCount) * 100) + "%"
    : "0%"

  // Get services with most issues (from analytics view)
  const buggyServices = serviceAnalytics.filter((s) => s.open_issues_count > 0).slice(0, 5)

  // Calculate helpfulness rate
  const totalHelpful = totalYes || 0
  const helpfulRate = totalFeedback ? Math.round((totalHelpful / totalFeedback) * 100) + "%" : "0%"

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader title={t("title")} subtitle={t("dashboard.description")} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <AnalyticsCard
          title={t("dashboard.cards.totalFeedback.title")}
          value={totalFeedback?.toString() || "0"}
          description={t("dashboard.cards.totalFeedback.description")}
        />
        <AnalyticsCard
          title={t("dashboard.cards.helpfulnessRate.title")}
          value={helpfulRate}
          description={t("dashboard.cards.helpfulnessRate.description")}
        />
        <AnalyticsCard
          title={t("dashboard.cards.staleServices.title")}
          value={stalePercent}
          description={t("dashboard.cards.staleServices.description")}
        />
        <AnalyticsCard
          title={t("dashboard.cards.totalServices.title")}
          value={totalServicesCount?.toString() || "0"}
          description={t("dashboard.cards.totalServices.description")}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Service Performance Table */}
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold">{t("dashboard.tables.performance.title")}</h3>
            <p className="text-sm text-neutral-500">{t("dashboard.tables.performance.description")}</p>
          </div>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                    {t("dashboard.tables.common.service")}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                    {t("dashboard.tables.performance.helpfulness")}
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {serviceAnalytics.slice(0, 5).map((item) => (
                  <tr
                    key={item.service_id}
                    className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="p-4 align-middle">{item.name}</td>
                    <td className="p-4 align-middle">
                      <span
                        className={
                          item.helpfulness_percentage && item.helpfulness_percentage >= 70 ? "text-green-600" : ""
                        }
                      >
                        {item.helpfulness_percentage ? `${item.helpfulness_percentage}%` : t("dashboard.noData")}
                      </span>
                    </td>
                  </tr>
                ))}
                {serviceAnalytics.length === 0 && (
                  <tr className="border-b">
                    <td colSpan={2} className="p-4 text-center text-neutral-500">
                      {t("dashboard.tables.performance.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Services Needing Attention */}
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold">{t("dashboard.tables.issues.title")}</h3>
            <p className="text-sm text-neutral-500">{t("dashboard.tables.issues.description")}</p>
          </div>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                    {t("dashboard.tables.common.service")}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">
                    {t("dashboard.tables.issues.openIssues")}
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {buggyServices.map((item) => (
                  <tr
                    key={item.service_id}
                    className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="p-4 align-middle">{item.name}</td>
                    <td className="p-4 align-middle">
                      <span className="font-bold text-amber-600">{item.open_issues_count}</span>
                    </td>
                  </tr>
                ))}
                {buggyServices.length === 0 && (
                  <tr className="border-b">
                    <td colSpan={2} className="p-4 text-center text-neutral-500">
                      {t("dashboard.tables.issues.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
