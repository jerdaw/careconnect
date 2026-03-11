import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

import { readFileSync } from "node:fs"
import path from "node:path"

import exportServices from "./fixtures/services-export.json"

const LOCALES = ["en", "fr", "zh-Hans", "ar", "pt", "es", "pa"] as const

function getOfflineTitle(locale: (typeof LOCALES)[number]) {
  const messagesPath = path.join(process.cwd(), "messages", `${locale}.json`)
  const messages = JSON.parse(readFileSync(messagesPath, "utf8")) as { Offline?: { title?: string } }
  if (!messages.Offline?.title) throw new Error(`Missing Offline.title in ${messagesPath}`)
  return messages.Offline.title
}

test.describe("Offline route", () => {
  for (const locale of LOCALES) {
    test(`resolves /offline for locale ${locale}`, async ({ page, context }) => {
      await mockSupabase(page)

      await context.addCookies([
        {
          name: "NEXT_LOCALE",
          value: locale,
          url: "http://localhost:3000",
        },
      ])

      await page.goto("/offline")
      await page.waitForLoadState("domcontentloaded")

      await expect(page.locator("html")).toHaveAttribute("lang", locale)
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr")

      const title = getOfflineTitle(locale)
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
    })
  }
})

test("search still works after going offline (IndexedDB cache)", async ({ page, context }) => {
  await mockSupabase(page)

  const expectedServiceName = exportServices[0]?.name
  if (!expectedServiceName) {
    throw new Error("Missing expected service fixture: tests/e2e/fixtures/services-export.json")
  }

  await page.route("**/api/v1/services/export", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        version: "test",
        count: exportServices.length,
        services: exportServices,
        embeddings: exportServices.map((s) => ({ id: s.id, embedding: [0, 0, 0] })),
      }),
    })
  })

  await context.addCookies([
    {
      name: "NEXT_LOCALE",
      value: "en",
      url: "http://localhost:3000",
    },
  ])

  await page.goto("/")
  await page.waitForURL(/\/en/)

  await page.waitForResponse(/\/api\/v1\/services\/export/, { timeout: 30_000 })

  // Ensure the offline DB has at least 1 service before switching offline.
  await page.waitForFunction(
    async (minCount) => {
      const openDb = () =>
        new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open("helpbridge-offline-v1")
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve(req.result)
        })

      const countServices = (db: IDBDatabase) =>
        new Promise<number>((resolve, reject) => {
          const tx = db.transaction("services", "readonly")
          const store = tx.objectStore("services")
          const req = store.count()
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve(req.result)
        })

      const db = await openDb()
      try {
        const count = await countServices(db)
        return count >= Number(minCount)
      } finally {
        db.close()
      }
    },
    exportServices.length,
    { timeout: 30_000 }
  )

  await context.setOffline(true)

  const searchInput = page.locator('input[type="text"]').first()
  await searchInput.fill("food")

  await expect(page.getByText(expectedServiceName)).toBeVisible()
})

// KNOWN LIMITATION: PWA/Service Worker is disabled in dev and CI environments
// WORKAROUND: Verify SW registration manually using production build (npm run build && npm start)
// TRACKING: Phase 1.5 audit (2026-02-09)
test.skip("Service worker is registered (manual)", async () => {
  // SW registration only occurs in production builds with HTTPS
})
