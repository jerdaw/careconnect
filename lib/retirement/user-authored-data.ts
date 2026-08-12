import { LEGACY_BRAND_KEYS } from "@/lib/legacy-brand"
import { RETIREMENT_OFFLINE_DATABASES } from "@/lib/retirement/client-data-cleanup"

export const RETIREMENT_USER_STORAGE_KEYS = [
  "careconnect_saved_searches",
  ...LEGACY_BRAND_KEYS.savedSearches,
  "careconnect_user_context",
  ...LEGACY_BRAND_KEYS.userContext,
] as const

export interface RetirementUserDataExport {
  exportedAt: string
  formatVersion: 1
  localPreferences: Record<string, unknown>
  pendingFeedback: Array<{ database: string; entries: unknown[] }>
}

interface UserDataDependencies {
  indexedDb?: IDBFactory
  localStorage?: Pick<Storage, "getItem" | "removeItem">
  now?: () => Date
}

function parseStoredValue(value: string): unknown {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function readPendingFeedback(indexedDb: IDBFactory, databaseName: string): Promise<unknown[]> {
  return new Promise((resolve) => {
    const request = indexedDb.open(databaseName)
    request.onupgradeneeded = () => request.transaction?.abort()
    request.onerror = () => resolve([])
    request.onsuccess = () => {
      const database = request.result
      if (!database.objectStoreNames.contains("pendingFeedback")) {
        database.close()
        resolve([])
        return
      }

      const transaction = database.transaction("pendingFeedback", "readonly")
      const entriesRequest = transaction.objectStore("pendingFeedback").getAll()
      entriesRequest.onsuccess = () => {
        database.close()
        resolve(entriesRequest.result)
      }
      entriesRequest.onerror = () => {
        database.close()
        resolve([])
      }
    }
  })
}

function clearPendingFeedback(indexedDb: IDBFactory, databaseName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const request = indexedDb.open(databaseName)
    request.onupgradeneeded = () => request.transaction?.abort()
    request.onerror = () => resolve(false)
    request.onsuccess = () => {
      const database = request.result
      if (!database.objectStoreNames.contains("pendingFeedback")) {
        database.close()
        resolve(false)
        return
      }

      const transaction = database.transaction("pendingFeedback", "readwrite")
      transaction.objectStore("pendingFeedback").clear()
      const finish = (cleared: boolean) => {
        database.close()
        resolve(cleared)
      }
      transaction.oncomplete = () => finish(true)
      transaction.onerror = () => finish(false)
      transaction.onabort = () => finish(false)
    }
  })
}

export async function collectRetirementUserData(
  dependencies: UserDataDependencies = {}
): Promise<RetirementUserDataExport> {
  const localStorage = dependencies.localStorage ?? (typeof window === "undefined" ? undefined : window.localStorage)
  const indexedDb = dependencies.indexedDb ?? (typeof indexedDB === "undefined" ? undefined : indexedDB)
  const localPreferences: Record<string, unknown> = {}

  if (localStorage) {
    for (const key of RETIREMENT_USER_STORAGE_KEYS) {
      const value = localStorage.getItem(key)
      if (value !== null) localPreferences[key] = parseStoredValue(value)
    }
  }

  const pendingFeedback = indexedDb
    ? (
        await Promise.all(
          RETIREMENT_OFFLINE_DATABASES.map(async (database) => ({
            database,
            entries: await readPendingFeedback(indexedDb, database),
          }))
        )
      ).filter(({ entries }) => entries.length > 0)
    : []

  return {
    exportedAt: (dependencies.now ?? (() => new Date()))().toISOString(),
    formatVersion: 1,
    localPreferences,
    pendingFeedback,
  }
}

export async function clearRetirementUserData(dependencies: UserDataDependencies = {}) {
  const localStorage = dependencies.localStorage ?? (typeof window === "undefined" ? undefined : window.localStorage)
  const indexedDb = dependencies.indexedDb ?? (typeof indexedDB === "undefined" ? undefined : indexedDB)
  let storageKeysRemoved = 0

  if (localStorage) {
    for (const key of RETIREMENT_USER_STORAGE_KEYS) {
      localStorage.removeItem(key)
      storageKeysRemoved += 1
    }
  }

  const pendingFeedbackDatabasesCleared = indexedDb
    ? (
        await Promise.all(
          RETIREMENT_OFFLINE_DATABASES.map((databaseName) => clearPendingFeedback(indexedDb, databaseName))
        )
      ).filter(Boolean).length
    : 0

  return { pendingFeedbackDatabasesCleared, storageKeysRemoved }
}
