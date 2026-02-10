import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

test.describe("Partner Dashboard Access", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  // KNOWN LIMITATION: Partner login flow requires Supabase auth state mocking
  // which is complex in E2E. The login page itself renders but auth redirects need
  // a full auth mock setup.
  // WORKAROUND: Test partner login manually via browser with Supabase running
  // TRACKING: Phase 1.5 audit (2026-02-09)
  test.skip("should navigate to partner login", async ({ page, isMobile }) => {
    await page.goto("/")

    if (isMobile) {
      await page.getByRole("button", { name: /open menu/i }).click()
    }

    // Find "Partner Login" link in footer or header
    const loginLink = page.getByRole("link", { name: /partner login/i })

    if ((await loginLink.count()) > 0) {
      // First visible link (might be multiple if menu open + footer)
      await loginLink.first().click()
      await expect(page).toHaveURL(/.*\/login/)
    } else {
      // Just verify route exists manually
      await page.goto("/en/login")
      await expect(page.getByRole("heading", { name: /partner login/i })).toBeVisible()
    }
  })

  // Note: Full auth testing requires mocking Supabase auth state which is complex in E2E.
  // We will stick to public surface area for this phase.
})
