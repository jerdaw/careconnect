"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function PushOptIn() {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications()
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations("Settings.Notifications")

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
      <Alert className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200">
         <AlertCircle className="h-4 w-4 text-neutral-500" />
         <AlertTitle>{t("notSupportedTitle")}</AlertTitle>
         <AlertDescription>
           {t("notSupportedDesc")}
         </AlertDescription>
      </Alert>
    )
  }

  // If blocked, guide them
  if (permission === "denied") {
    return (
      <Alert variant="destructive">
        <BellOff className="h-4 w-4" />
        <AlertTitle>{t("blockedTitle")}</AlertTitle>
        <AlertDescription>
          {t("blockedDesc")}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-white dark:bg-neutral-900 dark:border-neutral-800">
      <div className="space-y-0.5">
        <h3 className="text-base font-medium flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary-500" />
          {t("keepMeUpdated")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("keepMeUpdatedDesc")}
        </p>
      </div>
      <div>
        <Button
           variant={isSubscribed ? "outline" : "default"}
           onClick={handleToggle}
           disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubscribed ? t("disable") : t("enable")}
        </Button>
      </div>
    </div>
  )
}
