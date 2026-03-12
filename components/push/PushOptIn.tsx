"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function PushOptIn() {
  const { isConfigured, isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications({
    enabled: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations("Settings.Notifications")

  if (!isConfigured) {
    return null
  }

  const handleToggle = async () => {
    setIsLoading(true)
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
    setIsLoading(false)
  }

  if (!isSupported) {
    return (
      <Alert className="border-neutral-200 bg-neutral-50 dark:bg-neutral-900">
        <AlertCircle className="h-4 w-4 text-neutral-500" />
        <AlertTitle>{t("notSupportedTitle")}</AlertTitle>
        <AlertDescription>{t("notSupportedDesc")}</AlertDescription>
      </Alert>
    )
  }

  // If blocked, guide them
  if (permission === "denied") {
    return (
      <Alert variant="destructive">
        <BellOff className="h-4 w-4" />
        <AlertTitle>{t("blockedTitle")}</AlertTitle>
        <AlertDescription>{t("blockedDesc")}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="space-y-0.5">
        <h3 className="flex items-center gap-2 text-base font-medium">
          <Bell className="text-primary-500 h-4 w-4" />
          {t("keepMeUpdated")}
        </h3>
        <p className="text-muted-foreground text-sm">{t("keepMeUpdatedDesc")}</p>
      </div>
      <div>
        <Button variant={isSubscribed ? "outline" : "default"} onClick={handleToggle} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubscribed ? t("disable") : t("enable")}
        </Button>
      </div>
    </div>
  )
}
