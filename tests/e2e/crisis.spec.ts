import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

test.describe("Crisis Flow", () => {
    test.beforeEach(async ({ page }) => {
        await mockSupabase(page)
    })

    test("Crisis flow triggers safety banner", async ({ page }) => {
        // 1. Visit homepage
        await page.goto("/")

        // 2. Click "Crisis" quick link or search
        // Using search as it's more robust
        const searchInput = page.getByPlaceholder(/search for help/i)
        await searchInput.fill("suicide")
        await searchInput.press("Enter")

    // 3. Verify Crisis Detected Banner
    const safetyBanner = page.locator("text=EMERGENCY NOTICE") 
    await expect(safetyBanner.first()).toBeVisible()

    // Check for specific alert content
    // "Life-threatening emergency" or "Call 911"
    await expect(page.getByText("life-threatening emergency")).toBeVisible()
})

    test("Crisis category quick link works", async ({ page }) => {
        await page.goto("/")

        const crisisButton = page.getByRole("button", { name: /Crisis/i })
        await crisisButton.click()

        // Should filter by crisis category
        // Verify URL or results
        await expect(page).toHaveURL(/category=crisis/)

        // Verify banner
        await expect(page.getByText("EMERGENCY NOTICE")).toBeVisible()
    })
})
