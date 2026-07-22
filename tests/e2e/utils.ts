import { Page } from "@playwright/test"
import servicesFixture from "./fixtures/services.json"

export async function seedOfflineServices(page: Page, services: Array<{ id: string }>) {
  await page.evaluate(async (seedServices) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("careconnect-offline-v1", 1)
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains("services")) {
          const store = database.createObjectStore("services", { keyPath: "id" })
          store.createIndex("by-category", "intent_category")
        }
        if (!database.objectStoreNames.contains("embeddings")) {
          database.createObjectStore("embeddings", { keyPath: "id" })
        }
        if (!database.objectStoreNames.contains("meta")) {
          database.createObjectStore("meta", { keyPath: "id" })
        }
        if (!database.objectStoreNames.contains("pendingFeedback")) {
          database.createObjectStore("pendingFeedback", { keyPath: "id", autoIncrement: true })
        }
      }
      request.onsuccess = () => resolve(request.result)
    })

    const transaction = db.transaction(["services", "embeddings", "meta"], "readwrite")
    const serviceStore = transaction.objectStore("services")
    const embeddingStore = transaction.objectStore("embeddings")
    const metaStore = transaction.objectStore("meta")

    for (const service of seedServices) {
      serviceStore.put(service)
      embeddingStore.put({ id: service.id, embedding: [0, 0, 0] })
    }
    metaStore.put({ id: "lastSync", value: new Date().toISOString() })
    metaStore.put({ id: "version", value: "e2e-governed-fixture" })

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    db.close()
  }, services)
}

export async function mockSupabase(page: Page) {
  // Mock Services Table Query
  await page.route("**/rest/v1/services*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(servicesFixture),
    })
  })

  // Mock Search API
  await page.route("**/api/v1/search/services", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: servicesFixture,
        meta: { total: servicesFixture.length },
      }),
    })
  })

  // Mock all other Supabase REST requests to prevent polling/timeouts
  await page.route("**/rest/v1/**", async (route) => {
    // Fallback for non-services requests (e.g. auth, other tables)
    await route.fulfill({ status: 200, body: JSON.stringify([]) })
  })

  // Create a proper auth session mock if needed, or just block auth endpoints
  await page.route("**/auth/v1/**", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ user: null }) })
  })

  // Block Analytics to prevent noise/errors
  await page.route("**/api/v1/analytics/**", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
  })

  // Block Embeddings pipeline if it happens clientside (legacy)
  await page.route("**/pipeline/*", async (route) => {
    await route.abort()
  })
}
