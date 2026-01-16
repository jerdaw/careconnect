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

interface KCCOfflineDB extends DBSchema {
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

const DB_NAME = "kcc-offline-v1"
const DB_VERSION = 1

/**
 * Open the offline database
 */
export async function getOfflineDB(): Promise<IDBPDatabase<KCCOfflineDB>> {
  return openDB<KCCOfflineDB>(DB_NAME, DB_VERSION, {
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
