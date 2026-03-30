import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/utils/supabase/server"
import { PartnerServiceList } from "@/components/partner/PartnerServiceList"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"
import { Button } from "@/components/ui/button"
import { Link, redirect } from "@/i18n/routing"
import { Plus } from "lucide-react"

export async function generateMetadata() {
  const t = await getTranslations("Dashboard")
  return { title: t("services.title") }
}

export default async function PartnerServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations("Dashboard")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const currentUser = user

  if (!currentUser) {
    return redirect({ href: "/login", locale })
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("services.title")}
        actions={
          <Button asChild>
            <Link href="/dashboard/services/create">
              <Plus className="mr-2 h-4 w-4" />
              {t("services.createService")}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <PartnerServiceList partnerId={currentUser.id} locale={locale} />
      </Suspense>
    </div>
  )
}
