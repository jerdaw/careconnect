
import { test, expect } from "@playwright/test"

test.describe("Multi-lingual Expansion & Provincial Services", () => {
  // Config for all supported languages
  const locales = [
    { code: "en", label: "English", searchLabel: "Search for services", hasDisclaimer: false },
    { code: "fr", label: "Français (CA)", searchLabel: "Rechercher des services", hasDisclaimer: false },
    { code: "ar", label: "العربية", searchLabel: "البحث عن الخدمات", hasDisclaimer: true },
    { code: "zh-Hans", label: "中文", searchLabel: "搜索服务", hasDisclaimer: true },
    { code: "es", label: "Español", searchLabel: "Buscar servicios", hasDisclaimer: true },
    { code: "pa", label: "ਪੰਜਾਬੀ", searchLabel: "ਸੇਵਾਵਾਂ ਦੀ ਖੋਜ ਕਰੋ", hasDisclaimer: true },
    { code: "pt", label: "Português", searchLabel: "Pesquisar serviços", hasDisclaimer: true }
  ]

  test("Language selector switches locales and updates UI labels", async ({ page }) => {
    // Start at root
    await page.goto("/")
    
    // Iterate through all locales
    for (const locale of locales) {
      if (locale.code === "en") continue // Already there by default, or we switch back to it at the end

      // Open Language Switcher
      await page.getByLabel("Select language", { exact: false }).click()
      
      // Click the specific language button
      await page.getByRole("button", { name: locale.label }).click()
      
      // Verify URL
      await page.waitForURL(new RegExp(`/${locale.code}`))
      await expect(page).toHaveURL(new RegExp(`/${locale.code}`))
      
      // Verify Search Label (using accessible name check)
      // This handles both aria-label and visible text
      await expect(page.getByRole("textbox", { name: locale.searchLabel })).toBeVisible()
      
      // Verify AI disclaimer banner visibility
      if (locale.hasDisclaimer) {
        await expect(page.getByRole("status")).toBeVisible()
      } else {
        await expect(page.getByRole("status")).not.toBeVisible()
      }

      // Special check for RTL
      if (locale.code === "ar") {
         const html = page.locator("html")
         await expect(html).toHaveAttribute("dir", "rtl")
      }
    }
  })

  test("Provincial crisis lines are visible and labeled", async ({ page }) => {
    // 1. Navigate to English home
    await page.goto("/en")
    
    // 2. Search for the Canada-wide service (9-8-8)
    const searchInput = page.getByPlaceholder("Search for help...")
    await searchInput.fill("9-8-8 Suicide Crisis")
    await searchInput.press("Enter")
    
    // 3. Verify the service card appears
    const card = page.locator(".service-card-print").filter({ hasText: "9-8-8 Suicide Crisis Helpline" })
    await expect(card).toBeVisible({ timeout: 15000 })
    
    // 4. Verify it has the "Canada-wide" badge
    await expect(card.getByText("Canada-wide")).toBeVisible()
  })
})
