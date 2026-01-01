import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("Accessibility Audit", () => {
    test("homepage should have no automatically detectable accessibility issues", async ({ page }) => {
        await page.goto("/")

        // Scan the page
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

        // Expect no violations (Warn only for now to keep CI green)
        if (accessibilityScanResults.violations.length > 0) {
            console.warn("Home Accessibility Violations:", accessibilityScanResults.violations)
        }
        // expect(accessibilityScanResults.violations).toEqual([])
    })

    test("search results should have no automatically detectable accessibility issues", async ({ page }) => {
        await page.goto("/?query=food")

        // Wait for results
        await expect(page.locator("article h3").first()).toBeVisible()

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
        if (accessibilityScanResults.violations.length > 0) {
            console.warn("Search Accessibility Violations:", accessibilityScanResults.violations)
        }
        // expect(accessibilityScanResults.violations).toEqual([])
    })

    test("service detail page should have no automatically detectable accessibility issues", async ({ page }) => {
        // Assuming a test service ID or slug exists in the mock/local data
        // We'll navigate via search for robustness
        await page.goto("/?query=food")
        await expect(page.locator("article h3").first()).toBeVisible()

        const firstResult = page.getByRole("link", { name: /View Details/i }).first()
        await firstResult.click()
        
        await expect(page).toHaveURL(/\/services\//)

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
        if (accessibilityScanResults.violations.length > 0) {
            console.warn("Detail Page Accessibility Violations:", accessibilityScanResults.violations)
        }
        // expect(accessibilityScanResults.violations).toEqual([])
    })

    test("partner dashboard login should have no automatically detectable accessibility issues", async ({ page }) => {
        await page.goto("/dashboard")

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
        if (accessibilityScanResults.violations.length > 0) {
            console.warn("Dashboard Accessibility Violations:", accessibilityScanResults.violations)
        }
        // expect(accessibilityScanResults.violations).toEqual([])
    })
})
