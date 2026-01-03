import { test, expect } from "@playwright/test"

test.describe("Multi-lingual Expansion & Provincial Services", () => {
  test.setTimeout(60000)

  test("Language selector switches locales and updates UI labels", async ({ page }) => {
    // Start on English
    await page.goto("/en")
    await expect(page.getByRole("heading", { name: "Kingston Care Connect" })).toBeVisible()

    // Switch to French
    await page.getByLabel("Select language").click()
    await page.getByRole("menuitem", { name: "Français" }).click()
    await page.waitForURL(/\/fr/)
    await expect(page).toHaveURL(/\/fr/)
    await expect(page.getByRole("heading", { name: "Kingston Care Connect" })).toBeVisible()

    // Switch to Arabic (RTL)
    await page.getByLabel("Select language", { exact: false }).click()
    await page.getByRole("menuitem", { name: "Arabic" }).click()
    await page.waitForURL(/\/ar/)
    await expect(page).toHaveURL(/\/ar/)
    // "Search for services" in Arabic
    await expect(page.getByText("البحث عن الخدمات")).toBeVisible()
    // Verify RTL direction
    const html = page.locator("html")
    await expect(html).toHaveAttribute("dir", "rtl")

    // Switch to Chinese
    await page.getByLabel("Select language", { exact: false }).click()
    await page.getByRole("menuitem", { name: "Chinese" }).click()
    await page.waitForURL(/\/zh-Hans/)
    await expect(page).toHaveURL(/\/zh-Hans/)
    // "Search for services" in Chinese
    await expect(page.getByText("搜索服务")).toBeVisible()

    // Switch to Spanish
    await page.getByLabel("Select language", { exact: false }).click()
    await page.getByRole("menuitem", { name: "Spanish" }).click()
    await page.waitForURL(/\/es/)
    await expect(page).toHaveURL(/\/es/)
    // "Search for services" in Spanish
    await expect(page.getByText("Buscar servicios")).toBeVisible()
  })

  test("Provincial crisis lines are visible and labeled", async ({ page }) => {
    await page.goto("/en")
    
    // Search for a specific provincial service added in Tier 5
    const searchInput = page.getByPlaceholder("Search for help...")
    await searchInput.fill("988 Suicide Crisis")
    await searchInput.press("Enter")
    
    // Verify the service card appears
    const card = page.locator(".service-card-print").filter({ hasText: "988 Suicide Crisis Helpline" })
    await expect(card).toBeVisible({ timeout: 15000 })
    
    // Verify it has the "Province-Wide" badge
    await expect(card.getByText("Province-Wide")).toBeVisible()
  })
})
