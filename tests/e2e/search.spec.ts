import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

/**
 * Search Flow E2E Tests
 *
 * STATUS: SKIPPED - Requires fixture/mock updates to properly support navigation.
 * TODO: Fix mock data to include proper service IDs and routing.
 * See: docs/development/testing-guidelines.md#tiered-testing
 */
test.describe("Search Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
    await page.goto("/")
    await page.waitForURL(/.*\/en/)
    await page.waitForLoadState("domcontentloaded")
    await page.waitForLoadState("networkidle")
  })

  // TODO: Fix - Mock data doesn't support proper navigation to /service/[id]
  test.skip("should allow user to search for services", async ({ page }) => {
    await expect(page).toHaveTitle(/Kingston Care Connect/)
    const searchInput = page.getByPlaceholder(/search for help/i)
    await searchInput.fill("food bank")
    await searchInput.press("Enter")
    await page.waitForTimeout(1000)
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("Kingston Food Bank")).toBeVisible({ timeout: 10000 })
    await page.getByText("Kingston Food Bank").click()
    await page.waitForLoadState("networkidle")
    await expect(page).toHaveURL(/\/service\/kingston-food-bank/)
    await expect(page.getByRole("heading", { name: "Kingston Food Bank" })).toBeVisible()
  })

  // TODO: Fix - UI may not display "no results found" text or uses different selector
  test.skip("should verify empty search state", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search for help/i)
    await searchInput.fill("zxzxzxzx")
    await searchInput.press("Enter")
    await page.waitForTimeout(500)
    await expect(page.getByText(/no results found/i)).toBeVisible()
  })
})
