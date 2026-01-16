import { test, expect } from "@playwright/test"

test.describe("Legal Pages", () => {
  test("Terms of Service page loads and displays sections", async ({ page }) => {
    await page.goto("/terms")

    // Check Header
    await expect(page.getByRole("heading", { name: "Terms of Service", exact: true })).toBeVisible()

    // Check Critical Sections
    await expect(page.getByText("Acceptance of Terms")).toBeVisible()
    await expect(page.getByText("Emergency Services Disclaimer")).toBeVisible()
    await expect(page.getByText("Limitation of Liability")).toBeVisible()

    // Check Emergency Warning content
    await expect(page.getByText("THIS IS NOT AN EMERGENCY SERVICE")).toBeVisible()

    // Verify Footer link works
    await expect(page.getByRole("link", { name: "Terms of Service" })).toBeVisible()
  })

  test("Privacy Policy page loads and displays sections", async ({ page }) => {
    await page.goto("/privacy")

    // Check Header
    await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible()

    // Check Critical Sections
    await expect(page.getByText("Information We Collect")).toBeVisible()
    await expect(page.getByText("Zero-Log Policy")).toBeVisible()
    await expect(page.getByText("AI Assistant Privacy")).toBeVisible()

    // Check Contact Info (use .first() since this text appears multiple times)
    await expect(page.getByText("privacy@careconnect.ca").first()).toBeVisible()
  })

  test("Legal pages are accessible from footer", async ({ page }) => {
    await page.goto("/")
    await page.waitForURL(/.*\/en/)
    await page.waitForLoadState("domcontentloaded")
    await page.waitForLoadState("networkidle")

    // Ensure footer is visible and loaded
    const footer = page.getByRole("contentinfo")
    await expect(footer).toBeVisible()

    // Click Privacy
    await footer.getByRole("link", { name: "Privacy Policy" }).click()
    await page.waitForLoadState("networkidle")
    await expect(page).toHaveURL(/.*\/privacy/)

    // Go back and Click Terms
    await page.goto("/")
    await page.waitForURL(/.*\/en/)
    await page.waitForLoadState("domcontentloaded")
    await page.waitForLoadState("networkidle")

    // Ensure footer is visible again
    await expect(footer).toBeVisible()

    await footer.getByRole("link", { name: "Terms of Service" }).click()
    await page.waitForLoadState("networkidle")
    await expect(page).toHaveURL(/.*\/terms/)
  })

  test("Content Policy page loads and displays sections", async ({ page }) => {
    await page.goto("/content-policy")

    // Check Header
    await expect(page.getByRole("heading", { name: "Content Moderation Policy", exact: true })).toBeVisible()

    // Check Sections
    await expect(page.getByText("Prohibited Content")).toBeVisible()
    await expect(page.getByText("Spam or Advertising")).toBeVisible()
    await expect(page.getByText("User Submissions")).toBeVisible()

    // Check Reporting
    await expect(page.getByText("Reporting Process")).toBeVisible()
    await expect(page.getByText("privacy@careconnect.ca").first()).toBeVisible()
  })
})
