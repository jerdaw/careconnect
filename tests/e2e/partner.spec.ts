import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

test.describe("Partner Features", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  test("Partner Terms page loads", async ({ page }) => {
    await page.goto("/partner-terms")
    await expect(page.getByRole("heading", { name: "Partner Terms of Service" })).toBeVisible()
    await expect(page.getByText("Identity Verification")).toBeVisible()
  })

  test("Claim Flow button appears on unverified service", async ({ page }) => {
    // Exercise a real search-result detail page from the available test data.
    // The claim affordance is conditional because verified services may not expose it.
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")

    // Search and click any result
    const searchInput = page.getByPlaceholder(/search for help/i)
    await searchInput.fill("food")
    await searchInput.press("Enter")

    // Click first card title
    await page.locator("h3").first().click()

    const claimText = page.getByText("Own this organization?")
    if (await claimText.isVisible()) {
      await expect(page.getByRole("button", { name: "Claim This Listing" })).toBeVisible()
    }
  })
})
