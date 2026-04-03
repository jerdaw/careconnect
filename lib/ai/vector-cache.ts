import { openDB, DBSchema } from "idb"
import { LEGACY_BRAND_KEYS } from "@/lib/legacy-brand"

interface VectorDB extends DBSchema {
  vectors: {
    key: string
    value: {
      id: string
      embedding: number[]
      metadata: Record<string, unknown>
      updatedAt: number
    }
    indexes: { "by-id": string }
  }
}

const DB_NAME = "careconnect-vector-store"
const LEGACY_DB_NAMES = LEGACY_BRAND_KEYS.vectorDbNames
const DB_VERSION = 1
const MIGRATION_MARKER_PREFIX = "careconnect-vector-store-migrated-from-"

async function migrateLegacyVectorDb() {
  if (typeof window === "undefined") return

  for (const legacyDbName of LEGACY_DB_NAMES) {
    const migrationMarker = `${MIGRATION_MARKER_PREFIX}${legacyDbName}`
    if (window.localStorage.getItem(migrationMarker) === "true") continue

    const legacyDb = await openDB<VectorDB>(legacyDbName, DB_VERSION)
    const hasVectorsStore =
      typeof legacyDb.objectStoreNames.contains === "function"
        ? legacyDb.objectStoreNames.contains("vectors")
        : Array.from(legacyDb.objectStoreNames).includes("vectors")

    if (!hasVectorsStore) {
      legacyDb.close?.()
      window.indexedDB?.deleteDatabase?.(legacyDbName)
      window.localStorage.setItem(migrationMarker, "true")
      continue
    }

    const legacyVectors = await legacyDb.getAll("vectors")
    if (legacyVectors.length > 0) {
      const newDb = await openDB<VectorDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("vectors")) {
            const store = db.createObjectStore("vectors", { keyPath: "id" })
            store.createIndex("by-id", "id")
          }
        },
      })

      const tx = newDb.transaction("vectors", "readwrite")
      await Promise.all([...legacyVectors.map((vector) => tx.store.put(vector)), tx.done])
      newDb.close?.()
    }

    legacyDb.close?.()
    window.indexedDB?.deleteDatabase?.(legacyDbName)
    window.localStorage.setItem(migrationMarker, "true")
  }
}

export class VectorCache {
  private dbPromise

  constructor() {
    if (typeof window !== "undefined") {
      void migrateLegacyVectorDb().catch(() => undefined)
      this.dbPromise = openDB<VectorDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          const store = db.createObjectStore("vectors", { keyPath: "id" })
          store.createIndex("by-id", "id")
        },
      })
    }
  }

  async get(id: string) {
    if (!this.dbPromise) return null
    return (await this.dbPromise).get("vectors", id)
  }

  async set(id: string, embedding: number[], metadata: Record<string, unknown>) {
    if (!this.dbPromise) return
    await (
      await this.dbPromise
    ).put("vectors", {
      id,
      embedding,
      metadata,
      updatedAt: Date.now(),
    })
  }

  async clear() {
    if (!this.dbPromise) return
    await (await this.dbPromise).clear("vectors")
  }
}

export const vectorCache = new VectorCache()
