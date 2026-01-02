import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { mockSupabase } from "./utils"

test.describe("WCAG 2.1 AA Compliance", () => {
    test.beforeEach(async ({ page }) => {
        await mockSupabase(page)
    })

    test("homepage has no critical accessibility violations", async ({ page }) => {
        await page.goto("/")
        await page.waitForURL(/.*\/en/) // Wait for redirect to english locale
        await page.waitForLoadState("domcontentloaded")
        await page.waitForSelector("#main-content") 
        
        // Allow extra time for any secondary client-side hydration or animations
        await page.waitForTimeout(5000) 
        
        const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
        
        // Filter for critical/serious issues to avoid failing on minor warnings
        const violations = results.violations.filter(v => v.impact === "critical" || v.impact === "serious")
        
        if (violations.length > 0) {
            console.log("Accessibility Violations:", JSON.stringify(violations, null, 2))
        }
        
        expect(violations).toHaveLength(0)
    })

    test("skip link is keyboard accessible", async ({ page }) => {
        await page.goto("/")
        await page.waitForURL(/.*\/en/)
        await page.waitForLoadState("domcontentloaded")
        await page.waitForSelector("#main-content")
        
        // Allow extra time for any secondary client-side hydration or animations
        await page.waitForTimeout(5000)
        
        // Ensure initial focus is on the document body or reset
        await page.bringToFront()
        
        await page.keyboard.press("Tab")
        
        const skipLink = page.getByRole("link", { name: /skip to main/i })
        await expect(skipLink).toBeVisible()
        await expect(skipLink).toBeFocused()
    })
})
