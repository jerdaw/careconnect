"use client"

import { useTranslations } from "next-intl"
import { PushOptIn } from "@/components/push/PushOptIn"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { Wifi, WifiOff } from "lucide-react"

export default function SettingsPage() {
  const t = useTranslations("Settings")
  const { isOnline } = useNetworkStatus()

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Network Status Section */}
        <section className="space-y-4">
             <h2 className="text-lg font-semibold flex items-center gap-2">
                {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-500" />}
                {t("connectionStatus")}
             </h2>
             <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border">
                <p className="text-sm">
                    {isOnline ? t("onlineMessage") : t("offlineMessage")}
                </p>
             </div>
        </section>

        {/* Notifications Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("Notifications.title")}</h2>
          <PushOptIn />
        </section>
        
        {/* Localization/Personalization placeholder */}
        {/* We can move other settings here later */}

      </div>
    </div>
  )
}
