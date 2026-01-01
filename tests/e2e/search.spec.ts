import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

test.describe("Search Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the network layer to be deterministic
    await mockSupabase(page)
    await page.goto("/")
  })

  test("should allow user to search for services", async ({ page }) => {
    await expect(page).toHaveTitle(/Kingston Care Connect/)

    // 1. Type query (client-side filter should be instant with mocks)
    const searchInput = page.getByPlaceholder(/search for help/i)
    await searchInput.fill("food bank")
    await searchInput.press("Enter")

    // 2. Verify results appear instantly (no network wait needed due to mock)
    // The fixture "Kingston Food Bank" should be visible
    await expect(page.getByText("Kingston Food Bank")).toBeVisible()

    // 3. Click a result
    await page.getByText("Kingston Food Bank").click()

    // 4. Verify detail page
    await expect(page).toHaveURL(/\/services\/kingston-food-bank/)
    await expect(page.getByRole("heading", { name: "Kingston Food Bank" })).toBeVisible()
  })

  test("should verify empty search state", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search for help/i)
    await searchInput.fill("zxzxzxzx") // Non-existent term
    await searchInput.press("Enter")

    // Should show "No results found"
    await expect(page.getByText(/no results found/i)).toBeVisible()
  })
})
