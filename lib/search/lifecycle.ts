import { loadServices } from "./data"
import { vectorCache } from "@/lib/ai/vector-cache"

/**
 * Initializes the vector store.
 * Checks if vectors are in IndexedDB. If not, loads from JSON and persists them.
 */
export async function initializeVectorStore() {
  const services = await loadServices()
  let count = 0

  for (const service of services) {
    if (!service.embedding) continue

    const cached = await vectorCache.get(service.id)
    if (!cached) {
      await vectorCache.set(service.id, service.embedding, {
        category: service.intent_category,
        lat: service.coordinates?.lat,
        lng: service.coordinates?.lng,
      })
      count++
    }
  }

  if (count > 0) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[VectorStore] Hydrated ${count} new vectors into IndexedDB.`)
    }
  }
  // Removed: "Warm" info log to reduce console noise
}
