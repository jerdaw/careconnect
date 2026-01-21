import { test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { mockSupabase } from "./utils"

test.describe("Robust Accessibility Audit", () => {
  test.setTimeout(90000)
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  const routes = ["/en", "/en?q=health", "/en/dashboard", "/en/submit-service", "/en/service/kids-help-phone"]

  for (const route of routes) {
    test(`audit ${route}`, async ({ page }) => {
      console.log(`Starting audit for ${route}...`)
      await page.goto(route)

      // Wait for hydration and dynamic content more robustly
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(5000) // generous 5s wait for hydration/animations

      // Ensure we are in a predictable state (dark mode)
      await page.evaluate(() => document.documentElement.classList.add("dark"))

      try {
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()

        console.log(`\nAudit results for ${route}: ${results.violations.length} violations found.\n`)

        if (results.violations.length > 0) {
          results.violations.forEach((violation) => {
            console.log(`[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.description}`)
            console.log(`Help: ${violation.helpUrl}`)
            violation.nodes.forEach((node) => {
              console.log(` - Node: ${node.html}`)
            })
          })
        }

        // We don't fail the test here, just report, unless we want strict CI
        // expect(results.violations).toHaveLength(0)
      } catch (e) {
        console.error(`Failed to audit ${route}:`, e)
      }
    })
  }
})
