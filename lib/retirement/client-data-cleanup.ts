export const RETIREMENT_CACHE_PREFIXES = [
  "services-api",
  "services-export",
  "start-url",
  "offline-fallback",
  "pwa-assets",
  "next-static",
  "next-image",
  "workbox-precache",
] as const

export const RETIREMENT_SERVICE_STORAGE_KEYS = [
  "careconnect-services-cache",
  "helpbridge-services-cache",
  "kcc-services-cache",
] as const

export const RETIREMENT_OFFLINE_DATABASES = [
  "careconnect-offline-v1",
  "helpbridge-offline-v1",
  "kcc-offline-v1",
] as const

export const RETIREMENT_VECTOR_DATABASES = ["careconnect-vector-store", "helpbridge-vector-store"] as const

const RETIREMENT_OFFLINE_STORES = ["services", "embeddings", "meta"] as const

export interface RetirementCleanupResult {
  cachesDeleted: number
  offlineDatabasesCleared: number
  serviceWorkersUnregistered: number
  storageKeysRemoved: number
  vectorDatabasesDeleted: number
}

interface RetirementCleanupDependencies {
  cacheStorage?: Pick<CacheStorage, "delete" | "keys">
  indexedDb?: IDBFactory
  localStorage?: Pick<Storage, "removeItem">
  serviceWorkerRegistrations?: () => Promise<Array<Pick<ServiceWorkerRegistration, "unregister">>>
}

export function isRetirementCacheName(cacheName: string): boolean {
  return RETIREMENT_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix))
}

function clearIndexedDbStores(indexedDb: IDBFactory, databaseName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const request = indexedDb.open(databaseName)

    request.onupgradeneeded = () => {
      // Do not create a database solely to clear it.
      request.transaction?.abort()
    }
    request.onerror = () => resolve(false)
    request.onsuccess = () => {
      const database = request.result
      const stores = RETIREMENT_OFFLINE_STORES.filter((storeName) => database.objectStoreNames.contains(storeName))

      if (stores.length === 0) {
        database.close()
        resolve(false)
        return
      }

      const transaction = database.transaction(stores, "readwrite")
      stores.forEach((storeName) => transaction.objectStore(storeName).clear())

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

function deleteIndexedDb(indexedDb: IDBFactory, databaseName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const request = indexedDb.deleteDatabase(databaseName)
    request.onsuccess = () => resolve(true)
    request.onerror = () => resolve(false)
    request.onblocked = () => resolve(false)
  })
}

export async function clearRetiredClientData(
  dependencies: RetirementCleanupDependencies = {}
): Promise<RetirementCleanupResult> {
  const cacheStorage = dependencies.cacheStorage ?? (typeof caches === "undefined" ? undefined : caches)
  const indexedDb = dependencies.indexedDb ?? (typeof indexedDB === "undefined" ? undefined : indexedDB)
  const localStorage = dependencies.localStorage ?? (typeof window === "undefined" ? undefined : window.localStorage)
  const serviceWorkerRegistrations =
    dependencies.serviceWorkerRegistrations ??
    (typeof navigator === "undefined" || !("serviceWorker" in navigator)
      ? undefined
      : () => navigator.serviceWorker.getRegistrations())

  let cachesDeleted = 0
  if (cacheStorage) {
    const cacheNames = await cacheStorage.keys().catch(() => [])
    const deletionResults = await Promise.all(
      cacheNames.filter(isRetirementCacheName).map((cacheName) => cacheStorage.delete(cacheName).catch(() => false))
    )
    cachesDeleted = deletionResults.filter(Boolean).length
  }

  let storageKeysRemoved = 0
  if (localStorage) {
    for (const key of RETIREMENT_SERVICE_STORAGE_KEYS) {
      try {
        localStorage.removeItem(key)
        storageKeysRemoved += 1
      } catch {
        // Storage can be unavailable in restricted browser contexts.
      }
    }
  }

  let offlineDatabasesCleared = 0
  let vectorDatabasesDeleted = 0
  if (indexedDb) {
    const cleared = await Promise.all(
      RETIREMENT_OFFLINE_DATABASES.map((databaseName) => clearIndexedDbStores(indexedDb, databaseName))
    )
    offlineDatabasesCleared = cleared.filter(Boolean).length

    const deleted = await Promise.all(
      RETIREMENT_VECTOR_DATABASES.map((databaseName) => deleteIndexedDb(indexedDb, databaseName))
    )
    vectorDatabasesDeleted = deleted.filter(Boolean).length
  }

  let serviceWorkersUnregistered = 0
  if (serviceWorkerRegistrations) {
    const registrations = await serviceWorkerRegistrations().catch(() => [])
    const unregisterResults = await Promise.all(registrations.map((registration) => registration.unregister()))
    serviceWorkersUnregistered = unregisterResults.filter(Boolean).length
  }

  return {
    cachesDeleted,
    offlineDatabasesCleared,
    serviceWorkersUnregistered,
    storageKeysRemoved,
    vectorDatabasesDeleted,
  }
}
