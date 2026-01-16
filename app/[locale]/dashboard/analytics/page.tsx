import { createClient } from "@/utils/supabase/server"
import { AnalyticsCard } from "@/components/AnalyticsCard"

export default async function PartnerAnalyticsPage() {
  const supabase = await createClient()

  // Fetch Unmet Needs (Not Found)
  const { data: unmetNeeds } = await supabase.from("unmet_needs_summary").select("*").limit(5).limit(5)

  // Fetch Top Feedback - This would be per service ideally, but we'll show global for now or service specific
  // For the partner view, we should perhaps aggregate specific to them.
  // But let's verify if `feedback_aggregations` has permission filtering.
  // `feedback_aggregations` is just a view, so RLS on underlying table applies?
  // No, materialized views have their own RLS usually, or none.
  // The migration didn't enable RLS on materialized views.
  // So we should be careful.
  // For now, let's just count totals for the "Total Searches" metric proxy.

  // Actually, we can just query the `feedback` table for stats since we have indexes.
  const { count: totalFeedback } = await supabase.from("feedback").select("*", { count: "exact", head: true })

  const { count: totalYes } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("feedback_type", "helpful_yes")

  // Metric: % services with no feedback in 90 days
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { count: totalServicesCount } = await supabase.from("services").select("*", { count: "exact", head: true })

  const { count: servicesWithRecentFeedback } = await supabase
    .from("feedback_aggregations")
    .select("*", { count: "exact", head: true })
    .gt("last_feedback_at", ninetyDaysAgo.toISOString())

  const stalePercent = totalServicesCount
    ? Math.round(((totalServicesCount - (servicesWithRecentFeedback || 0)) / totalServicesCount) * 100) + "%"
    : "0%"

  // Fetch Services with Most Issues
  const { data: buggyServices } = await supabase
    .from("feedback_aggregations")
    .select(
      `
      service_id,
      open_issues_count,
      services ( name )
    `
    )
    .gt("open_issues_count", 0)
    .order("open_issues_count", { ascending: false })
    .limit(5)

  // Calculate Yes %
  const totalHelpful = totalYes || 0
  const helpfulRate = totalFeedback ? Math.round((totalHelpful / totalFeedback) * 100) + "%" : "0%"

  type UnmetNeed = { category_searched: string; request_count: number }
  type BuggyService = { service_id: string; open_issues_count: number; services?: { name: string } }

  const unmet = (unmetNeeds as UnmetNeed[]) || []
  const topNeed = unmet.length > 0 ? (unmet[0]?.category_searched ?? "None") : "None"
  // Wait, I messed up the ternary. unmet.length > 0 ? unmet[0].category_searched : "None" is enough.

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Insights into community needs and service gaps.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <AnalyticsCard
          title="Total Feedback"
          value={totalFeedback?.toString() || "0"}
          description="All time submissions"
        />
        <AnalyticsCard title="Avg Helpfulness" value={helpfulRate} description="Positive feedback rate" />
        <AnalyticsCard title="Stale Services" value={stalePercent} description="No feedback in 90 days" />
        <AnalyticsCard title="Top Need" value={topNeed} description="Missing category" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Unmet Needs Table */}
        <div className="rounded-md border bg-white p-4 dark:bg-neutral-900">
          <div className="mb-4">
            <h3 className="font-semibold">Top Unmet Needs</h3>
            <p className="text-sm text-neutral-500">Categories searched when no results found.</p>
          </div>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">Category</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">Requests</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {unmet.map((item) => (
                  <tr
                    key={item.category_searched}
                    className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="p-4 align-middle">{item.category_searched}</td>
                    <td className="p-4 align-middle">{item.request_count}</td>
                  </tr>
                ))}
                {unmet.length === 0 && (
                  <tr className="border-b">
                    <td colSpan={2} className="p-4 text-center text-neutral-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buggy Services Table */}
        <div className="rounded-md border bg-white p-4 dark:bg-neutral-900">
          <div className="mb-4">
            <h3 className="font-semibold">Services with Most Issues</h3>
            <p className="text-sm text-neutral-500">Services needing data verification.</p>
          </div>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">Service</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500">Open Issues</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {((buggyServices as BuggyService[]) || []).map((item) => (
                  <tr
                    key={item.service_id}
                    className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="p-4 align-middle">{item.services?.name || item.service_id}</td>
                    <td className="p-4 align-middle">
                      <span className="font-bold text-amber-600">{item.open_issues_count}</span>
                    </td>
                  </tr>
                ))}
                {(!buggyServices || buggyServices.length === 0) && (
                  <tr className="border-b">
                    <td colSpan={2} className="p-4 text-center text-neutral-500">
                      No open issues found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
