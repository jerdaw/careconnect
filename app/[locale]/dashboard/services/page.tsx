import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/utils/supabase/server"
import { PartnerServiceList } from "@/components/partner/PartnerServiceList"
import { Skeleton } from "@/components/ui/skeleton"
import { redirect } from "next/navigation"

export async function generateMetadata() {
  const t = await getTranslations("Dashboard")
  return { title: t("services.title") }
}

export default async function PartnerServicesPage() {
  const t = await getTranslations("Dashboard")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("services.title")}</h1>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <PartnerServiceList partnerId={user.id} />
      </Suspense>
    </div>
  )
}
