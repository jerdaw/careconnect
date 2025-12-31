import { AnalyticsCard } from "@/components/AnalyticsCard"

// MOCK DATA since Supabase isn't configured
const MOCK_ANALYTICS = {
  totalSearches: 12450,
  topCategory: "Food Security",
  zeroResults: "4.2%",
}

export default async function PartnerAnalyticsPage() {
  // In a real implementation:
  // const supabase = createClient()
  // const { data } = await supabase...

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Partner Analytics</h1>
        <p className="text-muted-foreground">Insights into community needs and service gaps.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AnalyticsCard
          title="Total Searches (30d)"
          value={MOCK_ANALYTICS.totalSearches.toLocaleString()}
          description="+12% from last month"
        />
        <AnalyticsCard
          title="Top Category"
          value={MOCK_ANALYTICS.topCategory}
          description="Most requested service type"
        />
        <AnalyticsCard
          title="Zero Results Rate"
          value={MOCK_ANALYTICS.zeroResults}
          description="Searches with no matches"
        />
      </div>

      <div className="bg-muted/50 rounded-md border p-4">
        <h3 className="mb-2 font-semibold">Beta Access</h3>
        <p className="text-muted-foreground text-sm">
          These metrics are currently based on aggregated platform usage. Once your organization is verified, you will
          see specific traffic to your services.
        </p>
      </div>
    </div>
  )
}
