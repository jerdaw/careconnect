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
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { AccessibleFormField } from "@/components/forms/AccessibleFormField"

interface UpdateRequestModalProps {
  serviceId: string
  serviceName: string
  isOpen: boolean
  onClose: () => void
}

export function UpdateRequestModal({ serviceId, serviceName, isOpen, onClose }: UpdateRequestModalProps) {
  const t = useTranslations("Feedback")
  const { toast } = useToast()

  const [updates, setUpdates] = useState("")
  const [justification, setJustification] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/services/${serviceId}/update-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_updates: { notes: updates },
          justification,
        }),
      })

      const data = (await res.json()) as { success: boolean; message?: string }

      if (res.ok && data.success) {
        toast({
          title: t("requestSuccessTitle"),
          description: t("requestSuccessMessage"),
        })
        onClose()
        setUpdates("")
        setJustification("")
      } else {
        if (res.status === 401) {
          throw new Error("Please log in as a partner to request updates.")
        }
        throw new Error(data.message || "Failed to submit request")
      }
    } catch (err: unknown) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : t("errorMessage")
      toast({
        title: t("errorTitle"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("requestUpdateTitle")}</DialogTitle>
          <DialogDescription>{t("requestUpdateDesc", { service: serviceName })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <AccessibleFormField id="updates" label={t("fieldUpdatesLabel")}>
            <Textarea
              id="updates"
              placeholder={t("fieldUpdatesPlaceholder")}
              value={updates}
              onChange={(e) => setUpdates(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </AccessibleFormField>

          <AccessibleFormField id="justification" label={t("justificationLabel")}>
            <Textarea
              id="justification"
              placeholder={t("justificationPlaceholder")}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </AccessibleFormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !updates}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submitRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
