import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Eye, MousePointerClick, TrendingUp, FileText } from "lucide-react"
import { Link } from "@/i18n/routing"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"

export default async function DashboardPage() {
  const supabase = await createClient()
  const t = await getTranslations("Dashboard.overview")
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch pending update requests for this user
  const { count: pendingUpdates } = await supabase
    .from("service_update_requests")
    .select("*", { count: "exact", head: true })
    .eq("requested_by", user.email || "")
    .eq("status", "pending")

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardPageHeader title={t("welcomeTitle")} subtitle={t("welcomeSubtitle")} />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">{t("totalViews")}</CardTitle>
            <Eye className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="font-medium text-emerald-600">+12%</span> {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">{t("referrals")}</CardTitle>
            <MousePointerClick className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="font-medium text-emerald-600">+5%</span> {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">{t("verifiedServices")}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="mt-1 text-xs text-neutral-500">{t("allServicesUpToDate")}</p>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">{t("updateRequests")}</CardTitle>
            <FileText className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUpdates || 0}</div>
            <p className="mt-1 text-xs text-neutral-500">{t("pendingReview")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Prompt */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("dataQualityScore")}</CardTitle>
            <CardDescription>{t("dataQualityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-8 border-emerald-100">
                <span className="text-3xl font-bold text-emerald-600">A</span>
              </div>
              <div className="space-y-1">
                <p className="font-medium">{t("excellent")}</p>
                <p className="text-sm text-neutral-500">{t("dataQualityText")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="from-primary-900 to-primary-800 col-span-1 border-none bg-gradient-to-br text-white">
          <CardHeader>
            <CardTitle className="text-white">{t("verifyListingsTitle")}</CardTitle>
            <CardDescription className="text-primary-100">{t("verifyListingsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full sm:w-auto">
              {t("startVerification")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Link - Manage Services */}
      <div className="flex justify-end">
        <Button asChild className="gap-2">
          <Link href="/dashboard/services">{t("manageServices")} &rarr;</Link>
        </Button>
      </div>
    </div>
  )
}
