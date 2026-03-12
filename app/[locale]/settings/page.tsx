"use client"

import { useTranslations } from "next-intl"
import { PushOptIn } from "@/components/push/PushOptIn"
import { isPushNotificationsConfigured } from "@/hooks/usePushNotifications"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { Wifi, WifiOff } from "lucide-react"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"

export default function SettingsPage() {
  const t = useTranslations("Settings")
  const { isOnline } = useNetworkStatus()
  const pushNotificationsConfigured = isPushNotificationsConfigured()

  return (
    <main id="main-content" tabIndex={-1} className="container max-w-2xl py-10 focus:outline-none">
      <PageHeader title={t("title")} subtitle={t("description")} align="left" className="mb-8" />

      <div className="space-y-8">
        {/* Network Status Section */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            {t("connectionStatus")}
          </h2>
          <Card className="p-4">
            <p className="text-sm">{isOnline ? t("onlineMessage") : t("offlineMessage")}</p>
          </Card>
        </section>

        {/* Notifications Section */}
        {pushNotificationsConfigured && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t("Notifications.title")}</h2>
            <PushOptIn />
          </section>
        )}
      </div>
    </main>
  )
}
