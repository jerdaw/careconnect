import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import enMessages from "../../messages/en.json"
import frMessages from "../../messages/fr.json"

test.describe("controlled public-directory retirement", () => {
  test("former public routes expose only the localized retirement surface", async ({ page }) => {
    const contactedDirectoryEndpoints: string[] = []
    page.on("request", (request) => {
      const url = request.url()
      if (/supabase\.co|\/api\/v1\/(services|search|analytics|feedback)|\/api\/feedback/.test(url)) {
        contactedDirectoryEndpoints.push(url)
      }
    })

    await page.goto("/en?q=crisis", { waitUntil: "networkidle" })

    await expect(page.getByRole("heading", { level: 1, name: enMessages.Retirement.title })).toBeVisible()
    await expect(page.locator("form, input, textarea, select")).toHaveCount(0)
    await expect(page.locator('a[href^="/service/"]')).toHaveCount(0)
    await expect(page.getByRole("link", { name: enMessages.Retirement.call911 })).toHaveAttribute("href", "tel:911")
    await expect(page.getByRole("link", { name: enMessages.Retirement.call988 })).toHaveAttribute("href", "tel:988")
    await expect(page.getByRole("link", { name: enMessages.Retirement.text988 })).toHaveAttribute("href", "sms:988")
    expect(contactedDirectoryEndpoints).toEqual([])

    await page.goto("/fr/service/retired-record", { waitUntil: "networkidle" })
    await expect(page.getByRole("heading", { level: 1, name: frMessages.Retirement.title })).toBeVisible()

    await page.goto("/ar/about", { waitUntil: "networkidle" })
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  })

  test("retirement page has no serious or critical WCAG A/AA violations", async ({ page }) => {
    await page.goto("/en", { waitUntil: "networkidle" })
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
    const materialViolations = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical"
    )

    expect(materialViolations).toEqual([])
  })

  test("non-health APIs and mobile associations fail closed while health metadata remains safe", async ({
    request,
  }) => {
    const servicesResponse = await request.get("/api/v1/services")
    expect(servicesResponse.status()).toBe(410)
    expect(servicesResponse.headers()["cache-control"]).toBe("no-store, max-age=0")
    expect(await servicesResponse.json()).toEqual({ error: "The CareConnect public directory has been retired." })

    const dottedApiResponse = await request.get("/api/v1/services/foo.json")
    expect(dottedApiResponse.status()).toBe(410)
    expect(dottedApiResponse.headers()["cache-control"]).toBe("no-store, max-age=0")

    const healthResponse = await request.get("/api/health")
    expect(healthResponse.status()).not.toBe(410)

    const sitemapResponse = await request.get("/sitemap.xml")
    expect(sitemapResponse.status()).toBe(200)
    expect(await sitemapResponse.text()).not.toContain("/service/")

    const manifestResponse = await request.get("/manifest.json")
    const manifest = (await manifestResponse.json()) as Record<string, unknown>
    expect(manifest.name).toBe("CareConnect - Directory Retired")
    expect(manifest).not.toHaveProperty("share_target")
    expect(manifest).not.toHaveProperty("shortcuts")

    expect(await (await request.get("/.well-known/assetlinks.json")).json()).toEqual([])
    expect(await (await request.get("/.well-known/apple-app-site-association")).json()).toEqual({
      applinks: { details: [] },
    })

    const retirementWorkerResponse = await request.get("/sw.js")
    expect(retirementWorkerResponse.status()).toBe(200)
    expect(retirementWorkerResponse.headers()["cache-control"]).toBe("no-store, no-cache, must-revalidate, max-age=0")
    expect(retirementWorkerResponse.headers()["cdn-cache-control"]).toBe("no-store")
    expect(retirementWorkerResponse.headers()["service-worker-allowed"]).toBe("/")
    const retirementWorker = await retirementWorkerResponse.text()
    expect(retirementWorker).toContain('importScripts("/retirement-cleanup-sw-20260815.js")')
    expect(retirementWorker).not.toContain('importScripts("/custom-sw.js")')
    expect(retirementWorker).not.toContain("precacheAndRoute")

    for (const workerPath of ["/custom-sw.js", "/retirement-cleanup-sw-20260815.js"]) {
      const workerResponse = await request.get(workerPath)
      expect(workerResponse.status()).toBe(200)
      expect(workerResponse.headers()["cache-control"]).toBe("no-store, no-cache, must-revalidate, max-age=0")
      expect(workerResponse.headers()["cdn-cache-control"]).toBe("no-store")
    }
  })

  test("upgrade removes prior listing data while preserving user-authored data for consented handling", async ({
    page,
    request,
  }) => {
    await page.goto("/en", { waitUntil: "networkidle" })
    await expect(page.locator("html")).toHaveAttribute("data-retirement-cleanup", "complete")

    await page.evaluate(async () => {
      for (const cacheName of [
        "services-api",
        "services-export-v2",
        "json-cache-v1",
        "start-url",
        "offline-fallback",
        "pwa-assets",
        "next-static",
        "next-image",
        "workbox-precache-v2-test",
        "unrelated-test-cache",
      ]) {
        const cache = await caches.open(cacheName)
        await cache.put("/cached-resource", new Response("cached listing"))
      }

      localStorage.setItem("careconnect-services-cache", "cached listing")
      localStorage.setItem("helpbridge-services-cache", "cached listing")
      localStorage.setItem("kcc-services-cache", "cached listing")
      localStorage.setItem("careconnect_saved_searches", '["food"]')
      localStorage.setItem(
        "careconnect_user_context",
        '{"ageGroup":"adult","identities":["newcomer"],"hasOptedIn":true}'
      )

      const seedOfflineDatabase = (databaseName: string) =>
        new Promise<void>((resolve, reject) => {
          const openRequest = indexedDB.open(databaseName, 1)
          openRequest.onupgradeneeded = () => {
            const database = openRequest.result
            database.createObjectStore("services")
            database.createObjectStore("embeddings")
            database.createObjectStore("meta")
            database.createObjectStore("pendingFeedback")
          }
          openRequest.onerror = () => reject(openRequest.error)
          openRequest.onsuccess = () => {
            const database = openRequest.result
            const transaction = database.transaction(["services", "embeddings", "meta", "pendingFeedback"], "readwrite")
            transaction.objectStore("services").put({ name: "stale listing" }, "service-1")
            transaction.objectStore("embeddings").put([0.1, 0.2], "service-1")
            transaction.objectStore("meta").put("old sync", "last-sync")
            transaction.objectStore("pendingFeedback").put({ message: "local draft" }, 1)
            transaction.oncomplete = () => {
              database.close()
              resolve()
            }
            transaction.onerror = () => reject(transaction.error)
          }
        })

      for (const databaseName of ["careconnect-offline-v1", "helpbridge-offline-v1", "kcc-offline-v1"]) {
        await seedOfflineDatabase(databaseName)
      }

      const seedVectorDatabase = (databaseName: string) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(databaseName, 1)
          request.onupgradeneeded = () => request.result.createObjectStore("vectors")
          request.onerror = () => reject(request.error)
          request.onsuccess = () => {
            const database = request.result
            const transaction = database.transaction("vectors", "readwrite")
            transaction.objectStore("vectors").put([0.1, 0.2], "service-1")
            transaction.oncomplete = () => {
              database.close()
              resolve()
            }
            transaction.onerror = () => reject(transaction.error)
          }
        })

      for (const databaseName of ["careconnect-vector-store", "helpbridge-vector-store", "kcc-vector-store"]) {
        await seedVectorDatabase(databaseName)
      }

      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("workbox-expiration", 1)
        request.onupgradeneeded = () => request.result.createObjectStore("cache-entries", { keyPath: "id" })
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const database = request.result
          const transaction = database.transaction("cache-entries", "readwrite")
          transaction.objectStore("cache-entries").put({
            id: "retired-cache-entry",
            cacheName: "json-cache-v1",
            timestamp: Date.now(),
          })
          transaction.objectStore("cache-entries").put({
            id: "unrelated-cache-entry",
            cacheName: "unrelated-test-cache",
            timestamp: Date.now(),
          })
          transaction.oncomplete = () => {
            database.close()
            resolve()
          }
          transaction.onerror = () => reject(transaction.error)
        }
      })
    })

    await page.evaluate(async () => {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" })
    })

    await expect(page.getByRole("heading", { level: 1, name: enMessages.Retirement.title })).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute("data-retirement-cleanup", "complete")
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const cacheNames = await caches.keys()
          const registrations = await navigator.serviceWorker.getRegistrations()
          return {
            cacheNames,
            registrations: registrations.length,
            serviceStorageKeys: [
              localStorage.getItem("careconnect-services-cache"),
              localStorage.getItem("helpbridge-services-cache"),
              localStorage.getItem("kcc-services-cache"),
            ],
            userStorageKeys: [
              localStorage.getItem("careconnect_saved_searches"),
              localStorage.getItem("careconnect_user_context"),
            ],
          }
        })
      )
      .toEqual({
        cacheNames: ["unrelated-test-cache"],
        registrations: 0,
        serviceStorageKeys: [null, null, null],
        userStorageKeys: ['["food"]', '{"ageGroup":"adult","identities":["newcomer"],"hasOptedIn":true}'],
      })

    const readOfflineCounts = () =>
      page.evaluate(async () => {
        const readCounts = (databaseName: string) =>
          new Promise<Record<string, number>>((resolve, reject) => {
            const request = indexedDB.open(databaseName)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
              const database = request.result
              const transaction = database.transaction(
                ["services", "embeddings", "meta", "pendingFeedback"],
                "readonly"
              )
              const counts: Record<string, number> = {}
              let remaining = 4
              for (const storeName of ["services", "embeddings", "meta", "pendingFeedback"]) {
                const countRequest = transaction.objectStore(storeName).count()
                countRequest.onsuccess = () => {
                  counts[storeName] = countRequest.result
                  remaining -= 1
                  if (remaining === 0) {
                    database.close()
                    resolve(counts)
                  }
                }
                countRequest.onerror = () => reject(countRequest.error)
              }
            }
          })

        return Promise.all(["careconnect-offline-v1", "helpbridge-offline-v1", "kcc-offline-v1"].map(readCounts))
      })

    expect(await readOfflineCounts()).toEqual([
      { services: 0, embeddings: 0, meta: 0, pendingFeedback: 1 },
      { services: 0, embeddings: 0, meta: 0, pendingFeedback: 1 },
      { services: 0, embeddings: 0, meta: 0, pendingFeedback: 1 },
    ])

    const databaseState = await page.evaluate(async () => {
      const workboxEntries = await new Promise<Array<{ cacheName: string }>>((resolve, reject) => {
        const request = indexedDB.open("workbox-expiration")
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const database = request.result
          const entriesRequest = database.transaction("cache-entries", "readonly").objectStore("cache-entries").getAll()
          entriesRequest.onsuccess = () => {
            database.close()
            resolve(entriesRequest.result as Array<{ cacheName: string }>)
          }
          entriesRequest.onerror = () => reject(entriesRequest.error)
        }
      })
      return {
        databaseNames: (await indexedDB.databases()).map(({ name }) => name),
        workboxCacheNames: workboxEntries.map(({ cacheName }) => cacheName),
      }
    })
    expect(databaseState.databaseNames).not.toEqual(
      expect.arrayContaining(["careconnect-vector-store", "helpbridge-vector-store", "kcc-vector-store"])
    )
    expect(databaseState.workboxCacheNames).toEqual(["unrelated-test-cache"])

    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: enMessages.Retirement.exportLocalData }).click()
    const download = await downloadPromise
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const exportPayload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
      localPreferences: Record<string, unknown>
      pendingFeedback: Array<{ database: string; entries: unknown[] }>
    }
    expect(exportPayload.localPreferences.careconnect_saved_searches).toEqual(["food"])
    expect(exportPayload.pendingFeedback).toHaveLength(3)

    page.once("dialog", (dialog) => dialog.accept())
    await page.getByRole("button", { name: enMessages.Retirement.clearLocalData }).click()
    await expect(page.getByRole("status")).toHaveText(enMessages.Retirement.localDataCleared)
    expect(await readOfflineCounts()).toEqual([
      { services: 0, embeddings: 0, meta: 0, pendingFeedback: 0 },
      { services: 0, embeddings: 0, meta: 0, pendingFeedback: 0 },
      { services: 0, embeddings: 0, meta: 0, pendingFeedback: 0 },
    ])

    for (const oldScreenshot of ["mobile-detail.png", "mobile-search.png", "tablet-search.png"]) {
      expect((await request.get(`/screenshots/${oldScreenshot}`)).status()).toBe(404)
    }
    expect((await request.get("/api/v1/services")).status()).toBe(410)
  })

  test("a new retirement worker forces an already-open prior client to the localized retired route", async ({
    context,
    page,
  }) => {
    await context.route("**/prior-worker.js", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        headers: { "Service-Worker-Allowed": "/" },
        body: `
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()))
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))
self.addEventListener("fetch", (event) => {
  if (new URL(event.request.url).pathname === "/fr/legacy-open-client") {
    event.respondWith(new Response(
      "<!doctype html><html lang=fr><body><h1>Legacy directory client</h1></body></html>",
      { headers: { "Content-Type": "text/html" } }
    ))
  }
})
`,
      })
    )

    await page.goto("/en", { waitUntil: "networkidle" })
    await expect(page.locator("html")).toHaveAttribute("data-retirement-cleanup", "complete")
    await page.evaluate(async () => {
      const controllerChange = new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true })
      )
      await navigator.serviceWorker.register("/prior-worker.js", { scope: "/" })
      await controllerChange
    })

    await page.goto("/fr/legacy-open-client")
    await expect(page.getByRole("heading", { name: "Legacy directory client" })).toBeVisible()

    await page.evaluate(async () => {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" })
    })

    await expect(page).toHaveURL(/\/fr\/retired$/)
    await expect(page.getByRole("heading", { level: 1, name: frMessages.Retirement.title })).toBeVisible()
    await expect
      .poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length))
      .toBe(0)
  })
})
