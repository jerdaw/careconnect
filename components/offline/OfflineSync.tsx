"use client"

import { useEffect } from "react"
import { syncOfflineData } from "@/lib/offline/sync"
import { syncPendingFeedback } from "@/lib/offline/feedback"
import { logger } from "@/lib/logger"

export function OfflineSync() {
  useEffect(() => {
    // Initial sync on mount
    // We use requestIdleCallback if available to avoid blocking main thread during hydration
    const runSync = () => {
      syncOfflineData()
        .then((result) => {
          if (result.status === "synced") {
            logger.info("Offline data synced successfully", { component: "OfflineSync", action: "initial_sync" })
          }
        })
        .catch((err) => logger.error("Offline sync failed", err, { component: "OfflineSync" }))

      // Also try to sync pending feedback
      syncPendingFeedback().catch((err) =>
        logger.error("Pending feedback sync failed", err, { component: "OfflineSync" })
      )
    }

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => runSync())
    } else {
      setTimeout(runSync, 2000) // Fallback delay
    }

    // Optional: Listen for online event to re-sync
    const handleOnline = () => {
      logger.info("Network restored, checking for updates...", { component: "OfflineSync", action: "network_restore" })
      runSync()
    }

    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [])

  return null
}
