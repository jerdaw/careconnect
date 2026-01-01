import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { mockSupabase } from "./utils"

test.describe("WCAG 2.1 AA Compliance", () => {
    test.beforeEach(async ({ page }) => {
        await mockSupabase(page)
    })

    test("homepage has no critical accessibility violations", async ({ page }) => {
        await page.goto("/")
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
        await page.keyboard.press("Tab")
        
        const skipLink = page.getByRole("link", { name: /skip to main/i })
        await expect(skipLink).toBeFocused()
        await expect(skipLink).toBeVisible()
    })
})
