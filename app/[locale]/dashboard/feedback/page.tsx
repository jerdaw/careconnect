import { createClient } from "@/utils/supabase/server"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import { logger } from "@/lib/logger"
import { FeedbackList } from "@/components/dashboard/FeedbackList"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"

interface FeedbackItem {
  id: string
  service_id: string | null
  feedback_type: string
  message: string | null
  status: string
  created_at: string
  services: {
    name: string
    verification_level: string
  } | null
}

export default async function FeedbackPage() {
  const t = await getTranslations("Feedback")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // ==========================================================================
  // RLS-FIRST APPROACH: Feedback automatically filtered by organization
  // ==========================================================================
  // The "Partners can view their feedback" RLS policy on the feedback table
  // automatically filters this query to only return feedback for services
  // owned by the authenticated user's organization.
  // No explicit org_id or service_id filter is needed here.
  // ==========================================================================

  // Fetch feedback for services owned by this user's organization (RLS filters automatically)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- feedback table not in generated Supabase types
  const { data: feedback, error } = await (supabase.from("feedback" as any) as any)
    .select(
      `
      *,
      services (
        name,
        verification_level
      )
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    logger.error("Error fetching feedback", error, { component: "FeedbackDashboard" })
  }

  const typedFeedback = (feedback as unknown as FeedbackItem[]) || []

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} subtitle={t("description")} />
      <FeedbackList feedback={typedFeedback} />
    </div>
  )
}
