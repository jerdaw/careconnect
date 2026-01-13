"use client"

import { useEffect } from "react"
import { syncOfflineData } from "@/lib/offline/sync"
import { syncPendingFeedback } from "@/lib/offline/feedback"

export function OfflineSync() {
  useEffect(() => {
    // Initial sync on mount
    // We use requestIdleCallback if available to avoid blocking main thread during hydration
    const runSync = () => {
      syncOfflineData()
        .then((result) => {
           if (result.status === 'synced') {
             console.log("Offline data synced successfully")
           }
        })
        .catch(console.error)
      
      // Also try to sync pending feedback
      syncPendingFeedback().catch(console.error)
    }

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => runSync())
    } else {
      setTimeout(runSync, 2000) // Fallback delay
    }

    // Optional: Listen for online event to re-sync
    const handleOnline = () => {
        console.log("Network restored, checking for updates...")
        runSync()
    }
    
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  return null
}
