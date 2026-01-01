
import { test, expect } from "@playwright/test"

test.describe("Indigenous Filter", () => {
  test("should filter services by Indigenous category", async ({ page }) => {
    // 1. Visit home page
    await page.goto("/en")

    // 2. Click "Indigenous" category (using localized text or finding by text content)
    // Note: The category button might be localized. We'll look for "Indigenous" text.
    const categoryButton = page.getByRole("button", { name: "Indigenous", exact: true })
    
    // Check if visible (it should be in the scrollable list)
    await expect(categoryButton).toBeVisible()
    
    // 3. Click filter
    await categoryButton.click()

    // 4. Verify UI state (button should be active)
    await expect(categoryButton).toHaveAttribute("aria-pressed", "true")

    // 5. Verify results
    // Should show "Indigenous Interprofessional Primary Care Team" or "Hope for Wellness" or "Kingston Indigenous Languages Nest"
    // We expect at least one of these to be visible.
    
    // Wait for list to update (implicit with web-first assertions, but good to be specific)
    const resultList = page.getByTestId("service-list")
    
    // Check for specific known Indigenous service
    await expect(page.getByText("Indigenous Interprofessional")).toBeVisible()
    await expect(page.getByText("Language Nest")).toBeVisible()
  })

  test("should show land acknowledgment on About page", async ({ page }) => {
    await page.goto("/en/about")
    await expect(page.getByRole("heading", { name: "Land Acknowledgment" })).toBeVisible()
    await expect(page.getByText("Katarokwi")).toBeVisible()
  })
})
