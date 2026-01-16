import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface FeedbackItem {
  id: string
  service_id: string | null
  feedback_type: string
  message: string | null
  status: string
  created_at: string
  services: {
    name: string
  } | null
}

interface FeedbackDetailProps {
  feedback: FeedbackItem | null
  open: boolean
  onClose: () => void
}

export function FeedbackDetail({ feedback, open, onClose }: FeedbackDetailProps) {
  const t = useTranslations("Feedback")
  const { toast } = useToast()
  const router = useRouter()
  const [updating, setUpdating] = useState(false)

  if (!feedback) return null

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/v1/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error("Failed to update")

      toast({
        title: t("statusUpdated"),
        description: t("statusUpdatedMessage", {
          status: t(`status${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`),
        }),
      })

      router.refresh()
      onClose()
    } catch {
      toast({
        title: t("errorTitle"),
        description: t("errorMessage"),
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("feedbackDetail")}</DialogTitle>
          <DialogDescription>
            {t("receivedOn", { date: new Date(feedback.created_at).toLocaleString() })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-bold">{t("service")}:</span>
            <span className="col-span-3 text-sm">
              {feedback.services?.name || (feedback.feedback_type === "not_found" ? t("general") : t("unknown"))}
            </span>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-bold">{t("issueType")}:</span>
            <span className="col-span-3">
              <Badge variant="outline">
                {t(`issueTypes.${feedback.feedback_type}`) === `Feedback.issueTypes.${feedback.feedback_type}`
                  ? feedback.feedback_type
                  : t(`issueTypes.${feedback.feedback_type}`)}
              </Badge>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <span className="mt-1 text-sm font-bold">{t("message")}:</span>
            <div className="bg-muted/20 col-span-3 min-h-[100px] rounded-md border p-3 text-sm">
              {feedback.message || <span className="text-muted-foreground italic">{t("noMessage")}</span>}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-bold">{t("status")}:</span>
            <select
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-9 w-[180px] items-center justify-between rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={feedback.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updating}
            >
              <option value="pending">{t("statusPending")}</option>
              <option value="reviewed">{t("statusReviewed")}</option>
              <option value="resolved">{t("statusResolved")}</option>
              <option value="dismissed">{t("statusDismissed")}</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updating}>
            {t("close")}
          </Button>
          {feedback.status === "pending" && (
            <Button onClick={() => handleStatusUpdate("resolved")} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("markResolved")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
