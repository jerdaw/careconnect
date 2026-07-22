import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

test.describe("Language Switching", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  test("Language switching toggles translation", async ({ page }) => {
    await page.goto("/")
    await page.waitForURL(/.*\/en/)
    await page.waitForLoadState("domcontentloaded")

    // Verify we're on the English page with the search input having English label
    const searchInput = page.getByRole("textbox", { name: /search for services/i })
    await expect(searchInput).toBeVisible()

    await page.getByRole("button", { name: "Language" }).click()
    await page.locator('[data-locale="fr"]').click()

    // Verify URL changes to French locale
    await expect(page).toHaveURL(/\/fr/)

    // Verify the search input now has the French label
    const frenchSearchInput = page.getByRole("textbox", { name: /rechercher des services/i })
    await expect(frenchSearchInput).toBeVisible()
  })
})
