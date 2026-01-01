import { test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { mockSupabase } from "./utils"

test.describe("Accessibility Audit", () => {
    test.beforeEach(async ({ page }) => {
        await mockSupabase(page)
    })

    test("homepage scan", async ({ page }) => {
        await page.goto("/")
        const results = await new AxeBuilder({ page }).analyze()
        if (results.violations.length) console.warn("Home A11y Violations:", results.violations)
    })

    test("search results scan", async ({ page }) => {
        await page.goto("/?query=food")
        await page.waitForSelector("role=main") // Wait for results to render
        const results = await new AxeBuilder({ page }).analyze()
        if (results.violations.length) console.warn("Search A11y Violations:", results.violations)
    })

    test("detail page scan", async ({ page }) => {
        // Direct navigation to valid mock ID
        await page.goto("/services/kingston-food-bank")
        const results = await new AxeBuilder({ page }).analyze()
        if (results.violations.length) console.warn("Detail A11y Violations:", results.violations)
    })

    test("partner dashboard scan", async ({ page }) => {
        await page.goto("/dashboard")
        const results = await new AxeBuilder({ page }).analyze()
        if (results.violations.length) console.warn("Dashboard A11y Violations:", results.violations)
    })
})
