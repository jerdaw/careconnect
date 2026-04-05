"use client"

import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { WifiOff, RotateCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { syncOfflineData } from "@/lib/offline/sync"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { OfflineSnapshotStatus } from "@/components/offline/OfflineSnapshotStatus"

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus()
  const t = useTranslations("Offline")
  const [isSyncing, setIsSyncing] = useState(false)

  const handleRefresh = async () => {
    setIsSyncing(true)
    await syncOfflineData(true)
    // If we're truly offline, sync won't really work, but we can try
    // Just a simulated delay if offline
    if (isOffline) {
      await new Promise((r) => setTimeout(r, 1000))
    }
    setIsSyncing(false)
  }

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b border-amber-200 bg-amber-100 dark:border-amber-800 dark:bg-amber-900/30"
        >
          <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
              <WifiOff className="h-4 w-4" />
              <div>
                <span>{t("bannerMessage")}</span>
                <OfflineSnapshotStatus variant="banner" />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isSyncing}
              className="h-auto px-2 py-1 text-amber-700 hover:bg-amber-200/50 hover:text-amber-900 dark:text-amber-300 dark:hover:bg-amber-800/50"
            >
              <RotateCw className={`mr-1 h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              {t("checkConnection")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
