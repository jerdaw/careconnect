"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import { syncOfflineData } from "@/lib/offline/sync"
import { syncPendingFeedback } from "@/lib/offline/feedback"
import { logger } from "@/lib/logger"

function getClientSyncErrorType(error: unknown): string {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name || "DOMException"
  }

  if (error instanceof Error) {
    return "Error"
  }

  return typeof error
}

export function OfflineSync() {
  const locale = useLocale()

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return
    }

    let cancelled = false

    const registerServiceWorker = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()

        if (registrations.length > 0) {
          return
        }

        const registration = await navigator.serviceWorker.register("/sw.js")

        if (!cancelled) {
          logger.info("Service worker registered", {
            component: "OfflineSync",
            action: "service_worker_register",
            scope: registration.scope,
          })
        }
      } catch (err) {
        if (!cancelled) {
          logger.warn("Service worker registration failed", {
            component: "OfflineSync",
            errorType: getClientSyncErrorType(err),
          })
        }
      }
    }

    if (document.readyState === "complete") {
      void registerServiceWorker()
    } else {
      const handleLoad = () => {
        void registerServiceWorker()
      }

      window.addEventListener("load", handleLoad)

      return () => {
        cancelled = true
        window.removeEventListener("load", handleLoad)
      }
    }

    return () => {
      cancelled = true
    }
  }, [])

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
        .catch((err) =>
          logger.warn("Offline sync failed", {
            component: "OfflineSync",
            errorType: getClientSyncErrorType(err),
          })
        )

      // Also try to sync pending feedback
      syncPendingFeedback().catch((err) =>
        logger.warn("Pending feedback sync failed", {
          component: "OfflineSync",
          errorType: getClientSyncErrorType(err),
        })
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

  // Keep the Workbox navigation fallback (`/offline`) warm for the current locale.
  // This reduces the chance of showing a stale-language cached offline page after a locale switch.
  useEffect(() => {
    fetch("/offline").catch((err) =>
      logger.warn("Offline fallback prewarm failed", {
        errorType: getClientSyncErrorType(err),
        locale,
      })
    )
  }, [locale])

  return null
}
