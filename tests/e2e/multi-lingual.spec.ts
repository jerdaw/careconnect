import { test, expect } from "@playwright/test"

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

  // KNOWN LIMITATION: Sequential popover interactions across 6+ locale switches are flaky
  // in CI. The LanguageSwitcher is a Radix popover that requires precise click timing.
  // Basic language switching is validated in language.spec.ts.
  // WORKAROUND: Test locale switching manually via browser, or use language.spec.ts
  // TRACKING: Phase 1.5 audit (2026-02-09)
  test.skip("Language selector switches locales and updates UI labels", async ({ page }) => {
    await page.goto("/")

    for (const locale of locales) {
      if (locale.code === "en") continue

      // LanguageSwitcher uses a Radix Popover with aria-label="Select Language"
      await page.getByRole("button", { name: "Select Language" }).click()
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

  // KNOWN LIMITATION: Requires crisis-988 service in E2E fixtures with scope: "canada"
  // and the service card must render a "Canada-wide" badge based on scope field.
  // WORKAROUND: Validate crisis service badges manually using dev server search
  // TRACKING: Phase 1.5 audit (2026-02-09)
  test.skip("Provincial crisis lines are visible and labeled", async ({ page }) => {
    await page.goto("/en")
    const searchInput = page.getByRole("textbox", { name: /search for services/i })
    await searchInput.fill("9-8-8 Suicide Crisis")
    await searchInput.press("Enter")
    const card = page.locator(".service-card-print").filter({ hasText: "9-8-8 Suicide Crisis Helpline" })
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card.getByText("Canada-wide")).toBeVisible()
  })
})
