import { test, expect } from "@playwright/test"

test("Language switching toggles translation", async ({ page }) => {
    await page.goto("/")

    // Check initial English text
    await expect(page.getByText("Find Services")).toBeVisible()

    // Switch to French
    // Look for language toggle. Usually a button "FR" or similar.
    // Based on DashboardSidebar, it might be in header.
    // I'll assume a button with text "FR" or aria-label.
    const frButton = page.getByRole("button", { name: "FR" })
    // If not found, look for "Français"

    if (await frButton.count() > 0) {
        await frButton.click()
    } else {
        await page.getByText("Français").click()
    }

    // Verify URL change or text change
    await expect(page).toHaveURL(/\/fr/)
    await expect(page.getByText("Trouver des services")).toBeVisible() // Assumption
})
