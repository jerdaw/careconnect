import { test, expect } from "@playwright/test"

test.describe("Search Flow", () => {
  test("should allow user to search for services", async ({ page }) => {
    // 1. Go to homepage
    await page.goto("/")
    await expect(page).toHaveTitle(/Kingston Care Connect/)

    // 2. Find search input and type query
    const searchInput = page.getByPlaceholder(/search for services/i)
    await searchInput.fill("food bank")
    await searchInput.press("Enter")

    // 3. Verify results page
    // Look for results container or specific result
    // Assuming results are displayed immediately or after navigation
    // (In current app, search is on same page or results page?)
    // Wait, homepage has large search bar.
    // Let's assume it updates the list below or stays on page.

    // Check if at least one service card is visible
    // We can look for "results found" or card elements
    await expect(page.locator("article h3").first()).toBeVisible()

    // 4. Click a result
    await page.locator("article h3").first().click()

    // 5. Verify detail page
    // URL should contain /services/
    await expect(page).toHaveURL(/\/services\//)
  })

  test("should verify empty search state", async ({ page }) => {
    await page.goto("/")
    const searchInput = page.getByPlaceholder(/search for services/i)
    await searchInput.fill("zxzxzxzx") // Non-existent term
    await searchInput.press("Enter")

    await expect(page.getByText(/no results found/i)).toBeVisible()
  })
})
