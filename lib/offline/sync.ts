import { saveAllServices, saveAllEmbeddings, getMeta, setMeta, getAllServices } from "./db"
import { Service } from "@/types/service"
import { isSupabaseAvailable, getSupabaseBreakerStats } from "@/lib/resilience/supabase-breaker"

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
    // Check circuit breaker state before attempting sync
    if (!isSupabaseAvailable()) {
      const stats = getSupabaseBreakerStats()
      console.warn("Sync skipped: Circuit breaker is open", stats)
      return {
        status: "error",
        error: `Circuit breaker open. Next attempt at ${new Date(stats.nextAttemptTime || 0).toISOString()}`
      }
    }

    const lastSync = await getMeta<string>("lastSync")
    const now = Date.now()

    // 1. Skip if recent (unless forced)
    if (!force && lastSync && now - new Date(lastSync).getTime() < SYNC_INTERVAL_MS) {
      const services = await getAllServices()
      if (services.length > 0) {
        return { status: "up-to-date", count: services.length }
      }
    }

    console.log("Starting offline data sync...")

    // 2. Delta Sync check using ETag from last version/date
    const dailyTag = `"${new Date().toISOString().split("T")[0]}"`
    const response = await fetch("/api/v1/services/export", {
      headers: {
        "If-None-Match": dailyTag, // Use a date tag as defined in the API
      },
    })

    if (response.status === 304) {
      console.log("Offline data is already up-to-date (304)")
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

    const timestamp = new Date().toISOString()
    await setMeta("lastSync", timestamp)
    await setMeta("version", data.version)

    console.log(`Sync complete. Loaded ${data.count} services.`)

    return { status: "synced", count: data.count }
  } catch (error) {
    console.error("Offline sync error:", error)

    // 3. Simple Retry Logic (Max 2 retries)
    if (retryCount < 2) {
      console.log(`Retrying sync (${retryCount + 1}/2)...`)
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
