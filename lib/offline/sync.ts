import { saveAllServices, saveAllEmbeddings, getMeta, setMeta, getAllServices } from "./db"
import { logger } from "@/lib/logger"
import { Service } from "@/types/service"
import { resetServiceDataCache } from "@/lib/search/data"

interface SyncResult {
  status: "synced" | "up-to-date" | "error"
  count?: number
  error?: unknown
}

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Syncs offline data from the API
 */
export async function syncOfflineData(force = false, retryCount = 0): Promise<SyncResult> {
  if (typeof window === "undefined") return { status: "error", error: "Server-side sync not supported" }

  try {
    const lastSync = await getMeta<string>("lastSync")
    const lastVersion = await getMeta<string>("version")
    const now = Date.now()

    // 1. Skip if recent (unless forced)
    if (!force && lastSync && now - new Date(lastSync).getTime() < SYNC_INTERVAL_MS) {
      const services = await getAllServices()
      if (services.length > 0) {
        return { status: "up-to-date", count: services.length }
      }
    }

    logger.info("Starting offline data sync")

    // 2. Delta Sync check using the last known export fingerprint
    const response = await fetch("/api/v1/services/export", {
      headers: lastVersion
        ? {
            "If-None-Match": `"${lastVersion}"`,
          }
        : undefined,
    })

    if (response.status === 304) {
      logger.info("Offline data is already up-to-date (304)")
      await setMeta("lastSync", new Date().toISOString())
      return { status: "up-to-date" }
    }

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as {
      version: string
      count: number
      services: Service[]
      embeddings: { id: string; embedding: number[] }[]
    }

    await saveAllServices(data.services)
    await saveAllEmbeddings(data.embeddings)
    resetServiceDataCache()

    const timestamp = new Date().toISOString()
    await setMeta("lastSync", timestamp)
    await setMeta("version", data.version)

    logger.info("Sync complete", { count: data.count })

    return { status: "synced", count: data.count }
  } catch (error) {
    logger.error("Offline sync error", { error })

    // 3. Simple Retry Logic (Max 2 retries)
    if (retryCount < 2) {
      logger.info("Retrying sync", { attempt: retryCount + 1, max: 2 })
      const delay = Math.pow(2, retryCount) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
      return syncOfflineData(force, retryCount + 1)
    }

    return { status: "error", error }
  }
}

/**
 * Hook to run sync automatically (can be used in a top-level component)
 */
export function useOfflineSync() {
  // This will be implemented as a hook or we can just call the function
  // For now, this logic resides here.
}
