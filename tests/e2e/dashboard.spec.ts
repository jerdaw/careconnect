import { test, expect } from "@playwright/test"

test.describe("Partner Dashboard Access", () => {
  test("should navigate to partner login", async ({ page }) => {
    await page.goto("/")

    // Find "Partner Login" link in footer or header
    const loginLink = page.getByRole("link", { name: /partner login/i })

    if ((await loginLink.count()) > 0) {
      await loginLink.click()
      await expect(page).toHaveURL(/\/concept\/partner-login/)
    } else {
      // Just verify route exists manually
      await page.goto("/concept/partner-login")
      await expect(page.getByRole("heading", { name: /partner login/i })).toBeVisible()
    }
  })

  // Note: Full auth testing requires mocking Supabase auth state which is complex in E2E.
  // We will stick to public surface area for this phase.
})
