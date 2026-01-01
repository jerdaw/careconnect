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

interface FeedbackModalProps {
  serviceId: string
  serviceName: string
  isOpen: boolean
  onClose: () => void
}

const FEEDBACK_TYPES = ["wrong_phone", "wrong_address", "service_closed", "other"] as const

export function FeedbackModal({ serviceId, serviceName, isOpen, onClose }: FeedbackModalProps) {
  const t = useTranslations("Feedback")
  const { toast } = useToast()
  const [type, setType] = useState<typeof FEEDBACK_TYPES[number]>("other")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, feedbackType: type, message }),
      })
      if (res.ok) {
        toast({ title: t("successTitle"), description: t("successMessage") })
        onClose()
        // Reset form
        setType("other")
        setMessage("")
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({ title: t("errorTitle"), description: t("errorMessage"), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { service: serviceName })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t("issueType")}</Label>
            <RadioGroup
              value={type}
              onValueChange={(val) => setType(val as typeof FEEDBACK_TYPES[number])}
            >
              {FEEDBACK_TYPES.map((ft) => (
                <div key={ft} className="flex items-center space-x-2">
                  <RadioGroupItem value={ft} id={ft} />
                  <Label htmlFor={ft} className="font-normal cursor-pointer">
                    {t(`types.${ft}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">{t("messageLabel")}</Label>
            <Textarea
              id="message"
              placeholder={t("messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
