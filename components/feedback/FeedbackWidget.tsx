"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, Flag, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { ReportIssueModal } from "./ReportIssueModal"
import { cn } from "@/lib/utils"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { queueFeedback } from "@/lib/offline/feedback"

interface FeedbackWidgetProps {
  serviceId: string
  serviceName: string
  className?: string
}

export function FeedbackWidget({ serviceId, serviceName, className }: FeedbackWidgetProps) {
  const t = useTranslations("Feedback")
  const { toast } = useToast()
  const { isOffline } = useNetworkStatus()
  const tOffline = useTranslations("Offline")
  
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)

  const handleVote = async (type: "helpful_yes" | "helpful_no") => {
    setIsSubmitting(true)
    try {
      if (isOffline) {
        await queueFeedback({
          feedback_type: type,
          service_id: serviceId,
          message: "",
          category_searched: ""
        })
        setHasVoted(true)
        toast({
          title: tOffline("savedForLater"), 
          description: tOffline("savedMessage"),
        })
        return
      }

      const res = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          feedback_type: type,
        }),
      })

      if (res.ok) {
        setHasVoted(true)
        toast({
          title: t("voteSuccessTitle"),
          description: t("voteSuccessMessage"),
        })
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({
        title: t("errorTitle"),
        description: t("errorMessage"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasVoted) {
    return (
      <div className={cn("rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground", className)}>
        <p>{t("alreadyVotedMessage")}</p>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <h3 className="font-semibold">{t("widgetTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("widgetSubtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote("helpful_yes")}
            disabled={isSubmitting}
            aria-label={t("yes")}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
            {t("yes")}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote("helpful_no")}
            disabled={isSubmitting}
            aria-label={t("no")}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
            {t("no")}
          </Button>

          <div className="mx-2 h-6 w-px bg-border" aria-hidden="true" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsIssueModalOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Flag className="mr-2 h-4 w-4" />
            {t("reportIssue")}
          </Button>
        </div>
      </div>

      <ReportIssueModal
        serviceId={serviceId}
        serviceName={serviceName}
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
      />
    </div>
  )
}
