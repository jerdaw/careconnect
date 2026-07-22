import { test, expect } from "@playwright/test"
import { mockSupabase, seedOfflineServices } from "./utils"

import { readFileSync } from "node:fs"
import path from "node:path"

import exportServices from "./fixtures/services-export.json"

// Playwright routes cannot intercept requests already handled by Workbox.
test.use({ serviceWorkers: "block" })

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
  const freshExportServices = exportServices.map((service) => ({
    ...service,
    provenance: {
      ...service.provenance,
      verified_at: new Date().toISOString(),
    },
  }))

  await page.route("**/api/v1/services/export", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        version: "test",
        count: freshExportServices.length,
        services: freshExportServices,
        embeddings: freshExportServices.map((s) => ({ id: s.id, embedding: [0, 0, 0] })),
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
  await seedOfflineServices(page, freshExportServices)

  await page.reload({ waitUntil: "load" })
  await page.getByRole("button", { name: "Language" }).click()
  await expect(page.getByRole("button", { name: "English" })).toBeVisible()
  await page.keyboard.press("Escape")
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  )

  const searchInput = page.locator('input[type="text"]').first()
  await searchInput.fill("food")
  const resultHeading = page.getByRole("heading", { level: 2, name: expectedServiceName })
  await expect(resultHeading).toBeVisible()
  await searchInput.fill("")

  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event("offline")))
  await expect(page.getByText("Using offline mode. Information may be outdated.")).toBeVisible()

  await searchInput.fill("food")
  await expect(resultHeading).toBeVisible()
})
