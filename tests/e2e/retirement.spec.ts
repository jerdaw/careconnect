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

  test("non-health APIs fail closed while health and public metadata remain boundary-safe", async ({ request }) => {
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
  })

  test("upgrade removes prior listing caches and offline service data", async ({ page, request }) => {
    await page.goto("/en", { waitUntil: "networkidle" })

    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.register("/sw.js")
      if (!registration.active) {
        const worker = registration.installing ?? registration.waiting
        await new Promise<void>((resolve) => {
          if (!worker || worker.state === "activated") {
            resolve()
            return
          }
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") resolve()
          })
        })
      }

      for (const cacheName of [
        "services-api",
        "services-export-v2",
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

      const vectorRequest = indexedDB.open("careconnect-vector-store", 1)
      await new Promise<void>((resolve, reject) => {
        vectorRequest.onupgradeneeded = () => vectorRequest.result.createObjectStore("vectors")
        vectorRequest.onerror = () => reject(vectorRequest.error)
        vectorRequest.onsuccess = () => {
          const database = vectorRequest.result
          const transaction = database.transaction("vectors", "readwrite")
          transaction.objectStore("vectors").put([0.1, 0.2], "service-1")
          transaction.oncomplete = () => {
            database.close()
            resolve()
          }
          transaction.onerror = () => reject(transaction.error)
        }
      })
    })

    await page.reload({ waitUntil: "networkidle" })

    await expect
      .poll(() =>
        page.evaluate(async () => {
          const cacheNames = await caches.keys()
          const registrations = await navigator.serviceWorker.getRegistrations()
          return {
            cacheNames,
            registrations: registrations.length,
            storageKeys: [
              localStorage.getItem("careconnect-services-cache"),
              localStorage.getItem("helpbridge-services-cache"),
              localStorage.getItem("kcc-services-cache"),
            ],
          }
        })
      )
      .toEqual({ cacheNames: ["unrelated-test-cache"], registrations: 0, storageKeys: [null, null, null] })

    const offlineCounts = await page.evaluate(async () => {
      const readCounts = (databaseName: string) =>
        new Promise<Record<string, number>>((resolve, reject) => {
          const request = indexedDB.open(databaseName)
          request.onerror = () => reject(request.error)
          request.onsuccess = () => {
            const database = request.result
            const transaction = database.transaction(["services", "embeddings", "meta", "pendingFeedback"], "readonly")
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

    expect(offlineCounts).toEqual([
      { services: 0, embeddings: 0, meta: 0, pendingFeedback: 1 },
      { services: 0, embeddings: 0, meta: 0, pendingFeedback: 1 },
      { services: 0, embeddings: 0, meta: 0, pendingFeedback: 1 },
    ])

    const databaseNames = await page.evaluate(async () => (await indexedDB.databases()).map(({ name }) => name))
    expect(databaseNames).not.toContain("careconnect-vector-store")

    for (const oldScreenshot of ["mobile-detail.png", "mobile-search.png", "tablet-search.png"]) {
      expect((await request.get(`/screenshots/${oldScreenshot}`)).status()).toBe(404)
    }
    expect((await request.get("/api/v1/services")).status()).toBe(410)
  })
})
