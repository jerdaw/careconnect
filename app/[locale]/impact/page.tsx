import { createClient } from "@/utils/supabase/server"
import { getTranslations } from "next-intl/server"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { Card } from "@/components/ui/card"
import { 
  ThumbsUp, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare,
  TrendingUp,
  AlertCircle
} from "lucide-react"

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
        <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900/30">
          {icon}
        </div>
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
        </div>
      </div>
    </Card>
  )
}

export default async function ImpactPage() {
  const t = await getTranslations("Impact")
  const supabase = await createClient()
  
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Fetch metrics directly from feedback table for accuracy
  // We use Promise.all for parallel fetching
  const [
    { count: helpfulYes },
    { count: helpfulNo },
    { count: totalIssues },
    { count: resolvedIssues }
  ] = await Promise.all([
    supabase.from("feedback").select("*", { count: "exact", head: true }).eq("feedback_type", "helpful_yes"),
    supabase.from("feedback").select("*", { count: "exact", head: true }).eq("feedback_type", "helpful_no"),
    supabase.from("feedback").select("*", { count: "exact", head: true }).eq("feedback_type", "issue"),
    supabase.from("feedback").select("*", { count: "exact", head: true }).eq("feedback_type", "issue").eq("status", "resolved")
  ])

  const safeHelpfulYes = helpfulYes || 0
  const safeHelpfulNo = helpfulNo || 0
  const safeTotalIssues = totalIssues || 0
  const safeResolvedIssues = resolvedIssues || 0

  const totalHelpful = safeHelpfulYes + safeHelpfulNo
  const helpfulRate = totalHelpful > 0 ? Math.round((safeHelpfulYes / totalHelpful) * 100) : 0
  const totalFeedback = totalHelpful + safeTotalIssues

  const { count: totalServices } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })

  const { count: verifiedRecently } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .gte("last_verified", ninetyDaysAgo.toISOString())

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 dark:bg-neutral-950">
      <Header />
      
      <Section className="pt-32 pb-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="heading-display text-4xl md:text-5xl font-bold mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </Section>

      <Section className="py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-6">{t("metricsTitle")}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title={t("satisfactionTitle")}
              value={`${helpfulRate}%`}
              description={t("satisfactionDesc", { count: totalHelpful })}
              icon={<ThumbsUp className="h-6 w-6 text-primary-600" />}
            />
            
            <MetricCard
              title={t("issuesResolvedTitle")}
              value={safeResolvedIssues}
              description={t("issuesResolvedDesc", { total: safeTotalIssues })}
              icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
            />
            
            <MetricCard
              title={t("servicesVerifiedTitle")}
              value={verifiedRecently || 0}
              description={t("servicesVerifiedDesc", { total: totalServices || 0 })}
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

      <Section className="py-12 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">{t("privacyTitle")}</h2>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-neutral-600 dark:text-neutral-300">
              {t("privacyText")}
            </p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <AlertCircle className="h-5 w-5 text-neutral-500" />
                <span className="text-sm">{t("noTracking")}</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <AlertCircle className="h-5 w-5 text-neutral-500" />
                <span className="text-sm">{t("noCookies")}</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <AlertCircle className="h-5 w-5 text-neutral-500" />
                <span className="text-sm">{t("voluntaryFeedback")}</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="py-12">
        <div className="mx-auto max-w-4xl text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-primary-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">{t("commitmentTitle")}</h2>
          <p className="text-neutral-600 dark:text-neutral-300">
            {t("commitmentText")}
          </p>
        </div>
      </Section>

      <Footer />
    </main>
  )
}
