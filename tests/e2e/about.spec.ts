import { test, expect } from "@playwright/test"

test.describe("About & Partners Pages", () => {
  test.setTimeout(60000) // Increase timeout for initial compilation

  test("About page loads and displays key sections", async ({ page }) => {
    await page.goto("/about")
    await page.waitForLoadState("domcontentloaded") // Wait for DOM readiness instead of network idle

    // Check Hero
    await expect(page.getByRole("heading", { name: "The Kingston 150" })).toBeVisible()

    // Check Metrics
    await expect(page.getByText("50+ Verified Services")).toBeVisible()
    await expect(page.getByText("Works Offline")).toBeVisible()

    // Check Sections
    await expect(page.getByRole("heading", { name: "How It Works" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Data Governance" })).toBeVisible()

    // Check CTA
    await expect(page.getByRole("link", { name: "Browse Services" })).toBeVisible()
  })

  test("Partners page loads and displays logos", async ({ page }) => {
    await page.goto("/about/partners")

    // Check Hero
    await expect(page.getByRole("heading", { name: "Built on Trusted Sources" })).toBeVisible()

    // Check Partner Cards (text content since we used placeholders)
    await expect(page.getByText("211 Ontario")).toBeVisible()
    await expect(page.getByText("City of Kingston")).toBeVisible()
    await expect(page.getByText("United Way KFL&A")).toBeVisible()

    // Check Verification Process
    await expect(page.getByText("Source Verification")).toBeVisible()
    await expect(page.getByText("Monthly Audits")).toBeVisible()
  })

  test("Navigation links work", async ({ page }) => {
    await page.goto("/")
    
    // Check About Link
    await page.getByRole("navigation").getByRole("link", { name: "About" }).click()
    await expect(page).toHaveURL(/.*\/about/)
    
    // Check Partners Link from About Page
    await page.getByRole("link", { name: "View Partners" }).click()
    await expect(page).toHaveURL(/.*\/about\/partners/)

    // Check Footer Link from Partners Page
    await page.getByRole("contentinfo").getByRole("link", { name: "About Us" }).click()
    await expect(page).toHaveURL(/.*\/about/)
  })
})
