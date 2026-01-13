"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { FeedbackSubmitSchema, FeedbackApiResponse } from "@/types/feedback"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { queueFeedback } from "@/lib/offline/feedback"

interface ReportIssueModalProps {
  serviceId: string
  serviceName: string
  isOpen: boolean
  onClose: () => void
}

const ISSUE_TYPES = [
  "wrong_contact_info",
  "service_closed",
  "eligibility_incorrect",
  "other"
] as const

export function ReportIssueModal({ serviceId, serviceName, isOpen, onClose }: ReportIssueModalProps) {
  const t = useTranslations("Feedback")
  const { toast } = useToast()
  
  // Local state for the specific issue subtype (not sending to API as separate field, but as part of message)
  const [issueType, setIssueType] = useState<typeof ISSUE_TYPES[number]>("other")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isOffline } = useNetworkStatus()
  const tOffline = useTranslations("Offline")

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Validate with Zod
      const payload = {
        service_id: serviceId,
        feedback_type: "issue",
        message: `[Type: ${issueType}] ${details}`,
      }
      
      const validation = FeedbackSubmitSchema.safeParse(payload)
      if (!validation.success) {
        throw new Error("Validation failed")
      }

      if (isOffline) {
          await queueFeedback({
              feedback_type: "issue",
              service_id: serviceId,
              message: payload.message,
              category_searched: ""
          })
          toast({ 
            title: tOffline("savedForLater"), 
            description: tOffline("savedMessage") 
          })
          onClose()
          setIssueType("other")
          setDetails("")
          return
      }

      const res = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as FeedbackApiResponse

      if (res.ok && data.success) {
        toast({ 
          title: t("issueReportedTitle"), 
          description: t("issueReportedMessage") 
        })
        onClose()
        // Reset form
        setIssueType("other")
        setDetails("")
      } else {
        throw new Error(data.message || "Failed")
      }
    } catch (err) {
      console.error(err)
      toast({ 
        title: t("errorTitle"), 
        description: t("errorMessage"), 
        variant: "destructive" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("reportIssueTitle")}</DialogTitle>
          <DialogDescription>
            {t("reportIssueDescription", { service: serviceName })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t("issueTypeLabel")}</Label>
            <RadioGroup
              value={issueType}
              onValueChange={(val) => setIssueType(val as typeof ISSUE_TYPES[number])}
            >
              {ISSUE_TYPES.map((ft) => (
                <div key={ft} className="flex items-center space-x-2">
                  <RadioGroupItem value={ft} id={ft} />
                  <Label htmlFor={ft} className="font-normal cursor-pointer">
                    {t(`issueTypes.${ft}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="details">{t("detailsLabel")}</Label>
            <Textarea
              id="details"
              placeholder={t("detailsPlaceholder")}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submitReport")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
