import { logger } from "@/lib/logger"

export const PILOT_DRAFT_STORAGE_PREFIX = "careconnect-pilot-draft-"
export const PILOT_DRAFT_MAX_AGE_MS = 8 * 60 * 60 * 1000
export const PILOT_DRAFT_SCHEMA_VERSION = 1

export type PilotDraftEnvelope<T = unknown> = {
  createdAt: string
  payload: T
  schemaVersion: typeof PILOT_DRAFT_SCHEMA_VERSION
}

type StorageLike = Pick<Storage, "getItem" | "key" | "length" | "removeItem">

export function isPilotDraftExpired(createdAt: string, nowMs = Date.now(), maxAgeMs = PILOT_DRAFT_MAX_AGE_MS): boolean {
  const createdAtMs = Date.parse(createdAt)
  return Number.isNaN(createdAtMs) || nowMs - createdAtMs > maxAgeMs
}

export function isPilotDraftStorageKey(key: string): boolean {
  return key.startsWith(PILOT_DRAFT_STORAGE_PREFIX)
}

export function clearPilotDraftStorage(storage: StorageLike): string[] {
  const removedKeys: string[] = []

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index)
    if (!key || !isPilotDraftStorageKey(key)) continue

    storage.removeItem(key)
    removedKeys.push(key)
  }

  return removedKeys
}

export function pruneExpiredPilotDraftStorage(storage: StorageLike, nowMs = Date.now()): string[] {
  const removedKeys: string[] = []

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index)
    if (!key || !isPilotDraftStorageKey(key)) continue

    const rawValue = storage.getItem(key)
    if (!rawValue) {
      storage.removeItem(key)
      removedKeys.push(key)
      continue
    }

    try {
      const envelope = JSON.parse(rawValue) as Partial<PilotDraftEnvelope>
      if (envelope.schemaVersion !== PILOT_DRAFT_SCHEMA_VERSION || !envelope.createdAt) {
        storage.removeItem(key)
        removedKeys.push(key)
        continue
      }

      if (isPilotDraftExpired(envelope.createdAt, nowMs)) {
        storage.removeItem(key)
        removedKeys.push(key)
      }
    } catch {
      storage.removeItem(key)
      removedKeys.push(key)
    }
  }

  return removedKeys
}

function getDraftCleanupErrorType(error: unknown): string {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name || "DOMException"
  }

  if (error instanceof Error) {
    return "Error"
  }

  return typeof error
}

export async function clearPilotDraftStorageOnSignOut(): Promise<string[]> {
  if (typeof window === "undefined") {
    return []
  }

  const removedKeys: string[] = []

  for (const [label, getStorage] of [
    ["localStorage", () => window.localStorage],
    ["sessionStorage", () => window.sessionStorage],
  ] as const) {
    try {
      removedKeys.push(...clearPilotDraftStorage(getStorage()))
    } catch (error) {
      logger.warn("Unable to clear pilot draft storage during sign-out", {
        errorType: getDraftCleanupErrorType(error),
        storage: label,
      })
    }
  }

  return removedKeys
}
