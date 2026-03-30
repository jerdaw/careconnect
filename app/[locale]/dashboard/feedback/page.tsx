import { createClient } from "@/utils/supabase/server"
import { getTranslations } from "next-intl/server"
import { logger } from "@/lib/logger"
import { FeedbackList } from "@/components/dashboard/FeedbackList"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"
import { redirect } from "@/i18n/routing"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"

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

interface FeedbackPageLoadResult {
  degraded: boolean
  feedback: FeedbackItem[]
}

async function loadFeedbackPageData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    supabase,
    user,
  }
}

export default async function FeedbackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations("Feedback")
  const { supabase, user } = await loadFeedbackPageData()
  const currentUser = user

  if (!currentUser) {
    return redirect({ href: "/login", locale })
  }

  // ==========================================================================
  // RLS-FIRST APPROACH: Feedback automatically filtered by organization
  // ==========================================================================
  // The "Partners can view their feedback" RLS policy on the feedback table
  // automatically filters this query to only return feedback for services
  // owned by the authenticated user's organization.
  // No explicit org_id or service_id filter is needed here.
  // ==========================================================================

  let result: FeedbackPageLoadResult = {
    degraded: false,
    feedback: [],
  }

  try {
    const feedbackResult = await withCircuitBreaker(async () =>
      supabase
        .from("feedback")
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
    )

    if (feedbackResult.error) {
      throw feedbackResult.error
    }

    result = {
      degraded: false,
      feedback: (feedbackResult.data as unknown as FeedbackItem[]) || [],
    }
  } catch (error) {
    logger.warn("Error fetching feedback dashboard page", {
      component: "FeedbackDashboard",
      userId: currentUser.id,
      error: error instanceof Error ? error.message : String(error),
    })

    result = {
      degraded: true,
      feedback: [],
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} subtitle={t("description")} />
      {result.degraded && (
        <Alert>
          <AlertDescription>{t("temporarilyUnavailable")}</AlertDescription>
        </Alert>
      )}
      <FeedbackList feedback={result.feedback} />
    </div>
  )
}
