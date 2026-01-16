"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { FeedbackDetail } from "./FeedbackDetail"

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

interface FeedbackListProps {
  feedback: FeedbackItem[]
}

export function FeedbackList({ feedback }: FeedbackListProps) {
  const t = useTranslations("Feedback")
  const tDash = useTranslations("Dashboard")
  const tBadge = useTranslations("VerificationLevels")
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "resolved":
        return "default"
      case "dismissed":
        return "secondary"
      case "reviewed":
        return "outline"
      default:
        return "destructive" // pending
    }
  }

  return (
    <>
      <div className="rounded-md border bg-white dark:bg-neutral-900">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800">
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  {t("issueType")}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  {t("service")}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  {tDash("verificationStatus")}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  {t("details")}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  {t("status")}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0">
                  {t("date")}
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {feedback.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer border-b transition-colors hover:bg-neutral-100/50"
                  onClick={() => setSelectedFeedback(item)}
                >
                  <td className="p-4 align-middle font-medium">
                    {/* Fallback to raw type if translation missing */}
                    {t(`types.${item.feedback_type}`) === `types.${item.feedback_type}`
                      ? item.feedback_type
                      : t(`types.${item.feedback_type}`)}
                  </td>
                  <td className="p-4 align-middle">
                    {item.services?.name || (item.feedback_type === "not_found" ? t("general") : t("unknown"))}
                  </td>
                  <td className="p-4 align-middle">
                    {item.services?.verification_level && (
                      <Badge variant="outline" className="text-xs">
                        {tBadge(item.services.verification_level)}
                      </Badge>
                    )}
                  </td>
                  <td className="max-w-xs truncate p-4 align-middle">{item.message || "-"}</td>
                  <td className="p-4 align-middle">
                    <Badge variant={getStatusVariant(item.status)}>
                      {t(`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`)}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!feedback?.length && (
                <tr className="border-b transition-colors hover:bg-neutral-100/50">
                  <td colSpan={6} className="p-4 text-center text-neutral-500">
                    {t("noFeedback")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FeedbackDetail feedback={selectedFeedback} open={!!selectedFeedback} onClose={() => setSelectedFeedback(null)} />
    </>
  )
}
