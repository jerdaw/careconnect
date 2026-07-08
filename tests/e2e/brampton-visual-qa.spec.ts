import { expect, test } from "@playwright/test"

import { mockSupabase } from "./utils"

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const

test.describe("Brampton visual QA capture", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
  })

  for (const viewport of viewports) {
    test(`homepage ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto("/en")
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(1000)

      await expect(page.getByRole("heading", { name: /CareConnect/i })).toBeVisible()
      await expect(page.getByRole("combobox", { name: /Change city/i })).toBeVisible()
      await expect(page.getByText(/Kingston|Brampton/).first()).toBeVisible()

      await page.screenshot({
        path: `test-results/brampton-visual-qa/home-${viewport.name}.png`,
        fullPage: false,
      })
    })

    test(`active search ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto("/en?q=health")
      await page.waitForLoadState("networkidle")
      await expect(page.locator(".service-card-print").first()).toBeVisible({ timeout: 15000 })

      await expect(page.getByRole("textbox", { name: /Search/i })).toBeVisible()
      await expect(page.getByRole("group", { name: /Category filters/i })).toBeVisible()

      await page.screenshot({
        path: `test-results/brampton-visual-qa/search-health-${viewport.name}.png`,
        fullPage: true,
      })
    })
  }
})
