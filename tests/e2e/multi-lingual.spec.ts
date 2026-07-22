import { test, expect } from "@playwright/test"
import { mockSupabase, seedOfflineServices } from "./utils"
import services from "../../data/services.json"
import englishMessages from "../../messages/en.json"
import type { Service } from "@/types/service"

// Keep governed export fixtures ahead of Workbox's runtime cache.
test.use({ serviceWorkers: "block" })

/**
 * Multi-lingual Expansion & Provincial Services E2E Tests
 *
 * These tests validate comprehensive locale switching and provincial service badges.
 * Basic language switching is covered by language.spec.ts.
 * See: docs/development/testing-guidelines.md#tiered-testing
 */
test.describe("Multi-lingual Expansion & Provincial Services", () => {
  const locales = [
    { code: "en", label: "English", searchLabel: "Search for services", hasDisclaimer: false },
    { code: "fr", label: "Français (CA)", searchLabel: "Rechercher des services", hasDisclaimer: false },
    { code: "ar", label: "العربية", searchLabel: "البحث عن الخدمات", hasDisclaimer: true },
    { code: "zh-Hans", label: "中文", searchLabel: "搜索服务", hasDisclaimer: true },
    { code: "es", label: "Español", searchLabel: "Buscar servicios", hasDisclaimer: true },
    { code: "pa", label: "ਪੰਜਾਬੀ", searchLabel: "ਸੇਵਾਵਾਂ ਦੀ ਖੋਜ ਕਰੋ", hasDisclaimer: true },
    { code: "pt", label: "Português", searchLabel: "Pesquisar serviços", hasDisclaimer: true },
  ]

  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  for (const locale of locales.filter((entry) => entry.code !== "en")) {
    test(`Language selector switches to ${locale.code} and updates UI labels`, async ({ page }) => {
      await page.goto("/en")
      await page.waitForURL(/\/en/)
      await page.getByRole("button", { name: "Language" }).click()
      await page.getByRole("button", { name: locale.label }).click()
      await expect(page).toHaveURL(new RegExp(`/${locale.code}`))
      await expect(page.getByRole("textbox", { name: locale.searchLabel })).toBeVisible()

      if (locale.hasDisclaimer) {
        await expect(page.getByRole("status")).toBeVisible()
      }

      if (locale.code === "ar") {
        const html = page.locator("html")
        await expect(html).toHaveAttribute("dir", "rtl")
      }
    })
  }

  test("Provincial crisis lines are visible and labeled", async ({ page, context }) => {
    const kidsHelpPhone = (services as Service[]).find((service) => service.id === "kids-help-phone")
    if (!kidsHelpPhone) throw new Error("Missing governed Kids Help Phone fixture")

    // Keep this presentation check pinned to the record's verified snapshot. The
    // current public search correctly excludes it once that snapshot expires.
    await page.clock.setFixedTime(new Date("2026-01-10T12:00:00Z"))
    await page.route("**/api/v1/services/export", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          version: "kids-help-phone-governed-snapshot",
          count: 1,
          services: [kidsHelpPhone],
          embeddings: [{ id: kidsHelpPhone.id, embedding: [0, 0, 0] }],
        }),
      })
    })

    await page.goto("/en")
    await page.waitForURL(/\/en/)
    await seedOfflineServices(page, [kidsHelpPhone])

    await page.reload({ waitUntil: "load" })
    await page.getByRole("button", { name: "Language" }).click()
    await expect(page.getByRole("button", { name: "English" })).toBeVisible()
    await page.keyboard.press("Escape")
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    )

    const searchInput = page.getByRole("textbox", { name: /search for services/i })
    await searchInput.fill("Kids Help Phone")
    const card = page.locator(".service-card-print").filter({ hasText: "Kids Help Phone" }).first()
    await expect(card).toBeVisible({ timeout: 15000 })
    await searchInput.fill("")

    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event("offline")))
    await expect(page.getByText("Using offline mode. Information may be outdated.")).toBeVisible()
    await searchInput.fill("Kids Help Phone")
    await searchInput.press("Enter")
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card.getByText(englishMessages.Distance.canadaWide).first()).toBeVisible()
  })
})
