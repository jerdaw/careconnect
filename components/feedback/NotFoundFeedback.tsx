"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, SearchX } from "lucide-react"
import { FeedbackCategoryEnum, FeedbackSubmitSchema } from "@/types/feedback"
import { cn } from "@/lib/utils"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { queueFeedback } from "@/lib/offline/feedback"
import { AccessibleFormField } from "@/components/forms/AccessibleFormField"

export function NotFoundFeedback({ className }: { className?: string }) {
  const t = useTranslations("Feedback")
  const { toast } = useToast()

  const [category, setCategory] = useState<string>("")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { isOffline } = useNetworkStatus()
  const tOffline = useTranslations("Offline")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        feedback_type: "not_found",
        category_searched: category || undefined,
        message: details,
      }

      // Validate
      const validation = FeedbackSubmitSchema.safeParse(payload)
      if (!validation.success) {
        throw new Error("Validation failed")
      }

      if (isOffline) {
        await queueFeedback({
          feedback_type: "not_found",
          message: details,
          category_searched: category || undefined,
        })
        toast({
          title: tOffline("savedForLater"),
          description: tOffline("savedMessage"),
        })
        setIsSuccess(true)
        return
      }

      const res = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })

      if (res.ok) {
        setIsSuccess(true)
        toast({
          title: t("notFoundSubmittedTitle"),
          description: t("notFoundSubmittedMessage"),
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

  if (isSuccess) {
    return (
      <div
        className={cn(
          "animate-in fade-in-50 flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed p-8 text-center",
          className
        )}
      >
        <div className="bg-primary/10 rounded-full p-3">
          <SearchX className="text-primary h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">{t("notFoundSuccessTitle")}</h3>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">{t("notFoundSuccessMessage")}</p>
        </div>
        <Button variant="outline" onClick={() => setIsSuccess(false)}>
          {t("submitAnother")}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("bg-card rounded-xl border p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="space-y-2 md:w-1/3">
          <h3 className="flex items-center gap-2 font-semibold">
            <SearchX className="text-muted-foreground h-5 w-5" />
            {t("notFoundTitle")}
          </h3>
          <p className="text-muted-foreground text-sm">{t("notFoundSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:w-2/3">
          <div className="grid gap-2">
            <Label id="not-found-cat-label">{t("categoryLabel")}</Label>
            <RadioGroup
              value={category}
              onValueChange={setCategory}
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
              aria-labelledby="not-found-cat-label"
            >
              {FeedbackCategoryEnum.options.map((cat) => (
                <div
                  key={cat}
                  className="hover:bg-muted/50 flex items-center space-x-2 rounded-md border p-2 transition-colors"
                >
                  <RadioGroupItem value={cat} id={`not_found_${cat}`} />
                  <Label htmlFor={`not_found_${cat}`} className="cursor-pointer text-xs font-normal">
                    {t(`categories.${cat}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <AccessibleFormField id="not-found-details" label={t("detailsLabel")}>
            <Textarea
              id="not-found-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("notFoundPlaceholder")}
              rows={3}
            />
          </AccessibleFormField>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || (!category && !details)}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("submitRequest")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
