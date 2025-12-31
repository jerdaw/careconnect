import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("Accessibility Audit", () => {
    test("homepage should have no automatically detectable accessibility issues", async ({ page }) => {
        await page.goto("/")

        // Scan the page
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

        // Expect no violations
        expect(accessibilityScanResults.violations).toEqual([])
    })

    test("search results should have no automatically detectable accessibility issues", async ({ page }) => {
        await page.goto("/?query=food")

        // Wait for results
        await page.waitForLoadState("networkidle")

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
        expect(accessibilityScanResults.violations).toEqual([])
    })

    test("service detail page should have no automatically detectable accessibility issues", async ({ page }) => {
        // Assuming a test service ID or slug exists in the mock/local data
        // We'll navigate via search for robustness
        await page.goto("/?query=food")
        await page.waitForLoadState("networkidle")

        const firstResult = page.getByRole("link", { name: /View Details/i }).first()
        await firstResult.click()

        await page.waitForLoadState("networkidle")

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
        expect(accessibilityScanResults.violations).toEqual([])
    })

    test("partner dashboard login should have no automatically detectable accessibility issues", async ({ page }) => {
        await page.goto("/dashboard")

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
        expect(accessibilityScanResults.violations).toEqual([])
    })
})
