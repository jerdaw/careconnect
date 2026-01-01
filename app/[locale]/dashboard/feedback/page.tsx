import { createClient } from "@/utils/supabase/server"
import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"

interface FeedbackItem {
  id: string
  service_id: string
  feedback_type: string
  message: string | null
  status: string
  created_at: string
  services: {
    name: string
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

  // Fetch feedback for services owned by this user
  // We rely on RLS, but explicit join helps if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: feedback, error } = await (supabase.from("feedback" as any) as any)
    .select(`
      *,
      services (
        name
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching feedback:", error)
  }

  const typedFeedback = (feedback as unknown as FeedbackItem[]) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-neutral-500">View and manage issues reported by the community.</p>
      </div>

      <div className="rounded-md border bg-white dark:bg-neutral-900">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800">
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  {t("issueType")}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  Service
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  Details
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {typedFeedback.map((item) => (
                <tr
                  key={item.id}
                  className="border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800"
                >
                  <td className="p-4 align-middle font-medium">
                    {t(`types.${item.feedback_type}`) || item.feedback_type}
                  </td>
                  <td className="p-4 align-middle">
                    {item.services?.name || "Unknown Service"}
                  </td>
                  <td className="p-4 align-middle max-w-xs truncate" title={item.message || undefined}>
                    {item.message || "-"}
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant={item.status === "resolved" ? "default" : "outline"}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!feedback?.length && (
                <tr className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50">
                  <td colSpan={5} className="p-4 text-center text-neutral-500">
                    No feedback received yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
