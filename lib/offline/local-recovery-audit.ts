import { getOfflineDB } from "@/lib/offline/db"
import { isPilotDraftStorageKey } from "@/lib/offline/pilot-draft-cleanup"
import { getOfflineSnapshotStatus, type OfflineSnapshotStatus } from "@/lib/offline/snapshot"
import { logger } from "@/lib/logger"

export type OfflineLocalRecoverySnapshot = {
  available: boolean
  counts: {
    embeddings: number | null
    pendingFeedback: number | null
    pilotDraftLocalStorage: number | null
    pilotDraftSessionStorage: number | null
    services: number | null
  }
  inspectedAt: string
  metadata: {
    hasExportVersion: boolean
    hasLastSync: boolean
    lastSync: string | null
    lastSyncStatus: OfflineSnapshotStatus
  }
  reason?: "offline_db_unavailable" | "server"
}

export type OfflineLocalRecoveryRecommendationId =
  | "inspect_browser_storage"
  | "no_immediate_recovery_action"
  | "preserve_queued_writes"
  | "run_in_browser"
  | "retry_offline_sync"

export type OfflineLocalRecoveryRecommendation = {
  destructive: false
  id: OfflineLocalRecoveryRecommendationId
  priority: "high" | "medium" | "low"
}

export type OfflineLocalRecoveryPlan = {
  hasQueuedLocalWrites: boolean
  recommendations: OfflineLocalRecoveryRecommendation[]
}

function countPilotDraftKeys(storage: Storage): number {
  let count = 0

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key && isPilotDraftStorageKey(key)) {
      count += 1
    }
  }

  return count
}

function getStorageDraftCounts(): Pick<
  OfflineLocalRecoverySnapshot["counts"],
  "pilotDraftLocalStorage" | "pilotDraftSessionStorage"
> {
  if (typeof window === "undefined") {
    return {
      pilotDraftLocalStorage: null,
      pilotDraftSessionStorage: null,
    }
  }

  return {
    pilotDraftLocalStorage: countPilotDraftKeysSafely("localStorage", () => window.localStorage),
    pilotDraftSessionStorage: countPilotDraftKeysSafely("sessionStorage", () => window.sessionStorage),
  }
}

function countPilotDraftKeysSafely(label: "localStorage" | "sessionStorage", getStorage: () => Storage): number | null {
  try {
    return countPilotDraftKeys(getStorage())
  } catch (error) {
    logger.warn("Unable to count pilot draft storage keys for recovery snapshot", {
      errorType: getRecoveryErrorType(error),
      storage: label,
    })

    return null
  }
}

function getRecoveryErrorType(error: unknown): string {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name || "DOMException"
  }

  if (error instanceof Error) {
    return "Error"
  }

  return typeof error
}

function hasPositiveCount(value: number | null): boolean {
  return typeof value === "number" && value > 0
}

function addRecommendation(
  recommendations: OfflineLocalRecoveryRecommendation[],
  id: OfflineLocalRecoveryRecommendationId,
  priority: OfflineLocalRecoveryRecommendation["priority"]
): void {
  if (recommendations.some((recommendation) => recommendation.id === id)) return

  recommendations.push({
    destructive: false,
    id,
    priority,
  })
}

export function buildOfflineLocalRecoveryPlan(snapshot: OfflineLocalRecoverySnapshot): OfflineLocalRecoveryPlan {
  const hasQueuedLocalWrites =
    hasPositiveCount(snapshot.counts.pendingFeedback) ||
    hasPositiveCount(snapshot.counts.pilotDraftLocalStorage) ||
    hasPositiveCount(snapshot.counts.pilotDraftSessionStorage)
  const hasUnknownDraftStorage =
    snapshot.counts.pilotDraftLocalStorage === null || snapshot.counts.pilotDraftSessionStorage === null
  const recommendations: OfflineLocalRecoveryRecommendation[] = []

  if (hasQueuedLocalWrites) {
    addRecommendation(recommendations, "preserve_queued_writes", "high")
  }

  if (snapshot.reason === "server") {
    addRecommendation(recommendations, "run_in_browser", "high")
  } else if (!snapshot.available || hasUnknownDraftStorage) {
    addRecommendation(recommendations, "inspect_browser_storage", "high")
  }

  if (
    snapshot.available &&
    (snapshot.metadata.lastSyncStatus !== "fresh" ||
      !snapshot.metadata.hasExportVersion ||
      snapshot.counts.services === 0 ||
      snapshot.counts.embeddings === 0)
  ) {
    addRecommendation(recommendations, "retry_offline_sync", hasQueuedLocalWrites ? "high" : "medium")
  }

  if (recommendations.length === 0) {
    addRecommendation(recommendations, "no_immediate_recovery_action", "low")
  }

  return {
    hasQueuedLocalWrites,
    recommendations,
  }
}

export async function buildOfflineLocalRecoverySnapshot(
  inspectedAt = new Date()
): Promise<OfflineLocalRecoverySnapshot> {
  const draftCounts = getStorageDraftCounts()
  const baseSnapshot = {
    counts: {
      embeddings: null,
      pendingFeedback: null,
      services: null,
      ...draftCounts,
    },
    inspectedAt: inspectedAt.toISOString(),
    metadata: {
      hasExportVersion: false,
      hasLastSync: false,
      lastSync: null,
      lastSyncStatus: "unknown" as const,
    },
  }

  if (typeof window === "undefined") {
    return {
      ...baseSnapshot,
      available: false,
      reason: "server",
    }
  }

  try {
    const db = await getOfflineDB()
    const [services, embeddings, pendingFeedback, lastSync, version] = await Promise.all([
      db.count("services"),
      db.count("embeddings"),
      db.count("pendingFeedback"),
      db.get("meta", "lastSync"),
      db.get("meta", "version"),
    ])

    const lastSyncValue = typeof lastSync?.value === "string" ? lastSync.value : null
    const lastSyncStatus = getOfflineSnapshotStatus(lastSyncValue, inspectedAt.getTime())

    return {
      ...baseSnapshot,
      available: true,
      counts: {
        ...baseSnapshot.counts,
        embeddings,
        pendingFeedback,
        services,
      },
      metadata: {
        hasExportVersion: Boolean(version?.value),
        hasLastSync: Boolean(lastSyncValue),
        lastSync: lastSyncValue,
        lastSyncStatus,
      },
    }
  } catch (error) {
    logger.warn("Unable to build offline local recovery snapshot", {
      errorType: getRecoveryErrorType(error),
      reason: "offline_db_unavailable",
    })

    return {
      ...baseSnapshot,
      available: false,
      reason: "offline_db_unavailable",
    }
  }
}
