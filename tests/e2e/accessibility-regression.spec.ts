import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

import { mockSupabase } from "./utils"

const regressionRoutes = [
  "/en",
  "/en?q=health",
  "/en/dashboard",
  "/en/submit-service",
  "/en/service/brampton-safe-centre-of-peel",
]

test.describe("Brampton closeout accessibility regressions", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  for (const route of regressionRoutes) {
    test(`${route} has no serious WCAG A/AA Axe violations`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(5000)
      await page.evaluate(() => document.documentElement.classList.add("dark"))

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
      const seriousViolations = results.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical"
      )

      expect(
        seriousViolations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => node.html),
        }))
      ).toEqual([])
    })
  }
})
