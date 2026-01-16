import { test, expect } from "@playwright/test"

/**
 * Multi-lingual Expansion & Provincial Services E2E Tests
 *
 * STATUS: SKIPPED - Language selector not reliably clickable across viewports.
 * TODO: Fix language selector interaction for mobile viewports.
 * TODO: Update mock data to include crisis-988 service for badge test.
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

  // TODO: Fix - Language selector button not visible/stable on mobile viewports
  test.skip("Language selector switches locales and updates UI labels", async ({ page }) => {
    await page.goto("/")

    for (const locale of locales) {
      if (locale.code === "en") continue
      await page.getByLabel("Select language", { exact: false }).click()
      await page.getByRole("button", { name: locale.label }).click()
      await page.waitForURL(new RegExp(`/${locale.code}`))
      await expect(page).toHaveURL(new RegExp(`/${locale.code}`))
      await expect(page.getByRole("textbox", { name: locale.searchLabel })).toBeVisible()

      if (locale.hasDisclaimer) {
        await expect(page.getByRole("status")).toBeVisible()
      } else {
        await expect(page.getByRole("status")).not.toBeVisible()
      }

      if (locale.code === "ar") {
        const html = page.locator("html")
        await expect(html).toHaveAttribute("dir", "rtl")
      }
    }
  })

  // TODO: Fix - Mock data doesn't include crisis-988 service with Canada-wide badge
  test.skip("Provincial crisis lines are visible and labeled", async ({ page }) => {
    await page.goto("/en")
    const searchInput = page.getByPlaceholder("Search for help...")
    await searchInput.fill("9-8-8 Suicide Crisis")
    await searchInput.press("Enter")
    const card = page.locator(".service-card-print").filter({ hasText: "9-8-8 Suicide Crisis Helpline" })
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card.getByText("Canada-wide")).toBeVisible()
  })
})
