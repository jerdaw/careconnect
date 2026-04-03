import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

/**
 * Search Flow E2E Tests
 *
 * Tests the core search experience using local search mode with mock data.
 * See: docs/development/testing-guidelines.md#tiered-testing
 */
test.describe("Search Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/")
    await page.waitForURL(/.*\/en/)
    await page.waitForLoadState("domcontentloaded")
  })

  test("should allow user to search for services", async ({ page }) => {
    await expect(page).toHaveTitle(/CareConnect/)

    // Use the actual aria-label from SearchBar component ("Search for services")
    const searchInput = page.getByRole("textbox", { name: /search for services/i })
    await searchInput.fill("food bank")
    await searchInput.press("Enter")

    // Verify search results appear (local search mode uses services.json data)
    await expect(page.getByText("Kingston Food Bank")).toBeVisible({ timeout: 10000 })
  })

  test("should verify empty search state", async ({ page }) => {
    const searchInput = page.getByRole("textbox", { name: /search for services/i })
    await searchInput.fill("zxzxzxzx")
    await searchInput.press("Enter")

    // The "no results" message uses the Search.noResults i18n key:
    // "No services found for \"{query}\""
    await expect(page.getByText(/no services found/i)).toBeVisible({ timeout: 5000 })
  })
})
