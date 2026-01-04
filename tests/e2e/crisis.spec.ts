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
        await searchInput.click()
        await searchInput.pressSequentially("suicide", { delay: 100 })
        await searchInput.press("Enter")

    // 3. Verify Crisis Detected Banner
    // "CrisisAlert.title" in en.json is "Are you in immediate danger?"
    const safetyBanner = page.getByText("Are you in immediate danger?")
    await expect(safetyBanner.first()).toBeVisible()

    // Check for specific alert content
    // "CrisisAlert.message": "If you or someone else is at risk of harm..."
    await expect(page.getByText(/risk of harm/i)).toBeVisible()
})

    test("Crisis category quick link works", async ({ page }) => {
        await page.goto("/")

        const crisisButton = page.getByRole("button", { name: /Crisis/i })
        await crisisButton.click()

        // Should filter by crisis category
        // Verify UI state instead of URL since app doesn't sync URL for simple filtering
        await expect(crisisButton).toHaveAttribute("aria-pressed", "true")

        // Verify banner
        await expect(page.getByText("Are you in immediate danger?")).toBeVisible()
    })
})
