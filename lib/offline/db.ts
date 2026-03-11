import { openDB, DBSchema, IDBPDatabase } from "idb"
import { Service } from "@/types/service"

export interface PendingFeedback {
  id?: number // Auto-increment key
  feedback_type: "helpful_yes" | "helpful_no" | "issue" | "not_found"
  service_id?: string
  message?: string
  category_searched?: string
  createdAt: string // ISO timestamp
  syncAttempts: number
}

interface HelpBridgeOfflineDB extends DBSchema {
  services: {
    key: string
    value: Service
    indexes: {
      "by-category": string
    }
  }
  embeddings: {
    key: string
    value: { id: string; embedding: number[] }
  }
  meta: {
    key: string
    value: { id: string; value: string | number | boolean }
  }
  pendingFeedback: {
    key: number
    value: PendingFeedback
  }
}

const DB_NAME = "helpbridge-offline-v1"
const LEGACY_DB_NAME = "kcc-offline-v1"
const DB_VERSION = 1

let migrationPromise: Promise<void> | null = null
type OfflineStoreName = "services" | "embeddings" | "meta" | "pendingFeedback"

async function migrateLegacyOfflineDB(db: IDBPDatabase<HelpBridgeOfflineDB>): Promise<void> {
  if (typeof window === "undefined") return

  if (!migrationPromise) {
    migrationPromise = (async () => {
      const alreadyMigrated = await db.get("meta", "legacy-migrated-from-kcc")
      if (alreadyMigrated?.value === true) return

      const legacyDb = await openDB<HelpBridgeOfflineDB>(LEGACY_DB_NAME, DB_VERSION)
      const legacyStores: OfflineStoreName[] = ["services", "embeddings", "meta", "pendingFeedback"]
      const legacyStoreNames = legacyDb.objectStoreNames
      const hasLegacyStores =
        !!legacyStoreNames &&
        (typeof legacyStoreNames.contains === "function"
          ? legacyStores.some((store) => legacyStoreNames.contains(store))
          : legacyStoreNames.length > 0)

      if (!hasLegacyStores) {
        legacyDb.close?.()
        window.indexedDB?.deleteDatabase?.(LEGACY_DB_NAME)
        await db.put("meta", { id: "legacy-migrated-from-kcc", value: true })
        return
      }

      const [services, embeddings, metaEntries, pendingFeedback] = await Promise.all([
        legacyDb.getAll("services"),
        legacyDb.getAll("embeddings"),
        legacyDb.getAll("meta"),
        legacyDb.getAll("pendingFeedback"),
      ])

      const tx = db.transaction(["services", "embeddings", "meta", "pendingFeedback"], "readwrite")

      await Promise.all([
        ...services.map((service) => tx.objectStore("services").put(service)),
        ...embeddings.map((embedding) => tx.objectStore("embeddings").put(embedding)),
        ...metaEntries.map((meta) => tx.objectStore("meta").put(meta)),
        ...pendingFeedback.map((feedback) => tx.objectStore("pendingFeedback").put(feedback)),
        tx.objectStore("meta").put({ id: "legacy-migrated-from-kcc", value: true }),
      ])

      await tx.done
      legacyDb.close?.()
    })()
  }

  await migrationPromise
}

/**
 * Open the offline database
 */
export async function getOfflineDB(): Promise<IDBPDatabase<HelpBridgeOfflineDB>> {
  const db = await openDB<HelpBridgeOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("services")) {
        const store = db.createObjectStore("services", { keyPath: "id" })
        store.createIndex("by-category", "intent_category")
      }
      if (!db.objectStoreNames.contains("embeddings")) {
        db.createObjectStore("embeddings", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("pendingFeedback")) {
        db.createObjectStore("pendingFeedback", { keyPath: "id", autoIncrement: true })
      }
    },
  })

  await migrateLegacyOfflineDB(db)
  return db
}

/**
 * Save services to IndexedDB
 */
export async function saveAllServices(services: Service[]): Promise<void> {
  const db = await getOfflineDB()
  const tx = db.transaction("services", "readwrite")
  await Promise.all([...services.map((s) => tx.store.put(s)), tx.done])
}

/**
 * Get all services from IndexedDB
 */
export async function getAllServices(): Promise<Service[]> {
  const db = await getOfflineDB()
  return db.getAll("services")
}

/**
 * Save embeddings to IndexedDB
 */
export async function saveAllEmbeddings(embeddings: { id: string; embedding: number[] }[]): Promise<void> {
  const db = await getOfflineDB()
  const tx = db.transaction("embeddings", "readwrite")
  await Promise.all([...embeddings.map((e) => tx.store.put(e)), tx.done])
}

/**
 * Get all embeddings from IndexedDB
 */
export async function getAllEmbeddings(): Promise<{ id: string; embedding: number[] }[]> {
  const db = await getOfflineDB()
  return db.getAll("embeddings")
}

/**
 * Get a single service by ID
 */
export async function getServiceById(id: string): Promise<Service | undefined> {
  const db = await getOfflineDB()
  return db.get("services", id)
}

/**
 * Metadata Helpers
 */
export async function getMeta<T extends string | number | boolean>(key: string): Promise<T | undefined> {
  const db = await getOfflineDB()
  const result = await db.get("meta", key)
  return result?.value as T | undefined
}

export async function setMeta(key: string, value: string | number | boolean): Promise<void> {
  const db = await getOfflineDB()
  await db.put("meta", { id: key, value })
}
