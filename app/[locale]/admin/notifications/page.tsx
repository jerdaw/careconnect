"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AccessibleFormField } from "@/components/forms/AccessibleFormField"
import { useToast } from "@/components/ui/use-toast"
import { useTranslations } from "next-intl"
import { BellRing, Send } from "lucide-react"

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const t = useTranslations("Admin.notifications")

  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState("service_update")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSend = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          type,
          url: "/", // Default to home
        }),
      })

      if (response.ok) {
        toast({
          title: t("toast.success"),
          description: t("toast.sent"),
          duration: 5000,
        })
        setTitle("")
        setMessage("")
      } else {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || t("toast.sendFailed"))
      }
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : t("toast.sendFailed"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="container max-w-2xl py-10 focus:outline-none">
      <div className="mb-8 space-y-2">
        <h1 className="heading-display text-3xl font-bold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            {t("composeTitle")}
          </CardTitle>
          <CardDescription>{t("composeDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccessibleFormField label={t("notificationType")} id="notif-type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="notif-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service_update">{t("types.serviceUpdate")}</SelectItem>
                <SelectItem value="emergency">{t("types.emergency")}</SelectItem>
                <SelectItem value="general">{t("types.general")}</SelectItem>
              </SelectContent>
            </Select>
          </AccessibleFormField>

          <AccessibleFormField label={t("titleLabel")} id="notif-title" required>
            <Input placeholder={t("titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
          </AccessibleFormField>

          <AccessibleFormField label={t("messageLabel")} id="notif-body" required>
            <Textarea
              placeholder={t("messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </AccessibleFormField>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSend} disabled={!title || !message || isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {t("sendBroadcast")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 rounded bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <strong>{t("noteLabel")}</strong> {t("implementationNote")}
      </div>
    </main>
  )
}
