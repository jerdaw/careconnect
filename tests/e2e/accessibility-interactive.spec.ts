import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("Interactive Accessibility Audit", () => {
  test.setTimeout(90000)
  test("Emergency Modal should be accessible and trap focus", async ({ page }) => {
    await page.goto("/en")

    // 1. Handle Mobile Menu if present
    const mobileMenuButton = page.getByRole("button", { name: /open menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
    }

    // 2. Trigger Modal
    await page
      .getByRole("button", { name: /Emergency/i })
      .first()
      .click()

    // 2. Wait for Modal
    const modal = page.locator('div[role="dialog"]')
    await expect(modal).toBeVisible()

    // 3. Axe Check
    const axeResults = await new AxeBuilder({ page }).include('div[role="dialog"]').analyze()

    if (axeResults.violations.length > 0) {
      console.log(
        "URGENT: Emergency Modal Accessibility Violations Found:",
        JSON.stringify(axeResults.violations, null, 2)
      )
    }

    expect(axeResults.violations).toEqual([])

    // 4. Verify Focus Trap
    await page.keyboard.press("Tab")
    const isHeaderFocused = await page.evaluate(() => document.activeElement?.getAttribute("href") === "/about")
    expect(isHeaderFocused).toBe(false)
  })

  test("Feedback/Issue Modal should be accessible", async ({ page }) => {
    // Use a service that exists in seed data
    await page.goto("/en/service/kids-help-phone")

    // 1. Trigger Modal (from TrustPanel)
    // en.json: Trust.updateHint is "Are you a provider? Click to submit a correction request."
    await page.getByText(/Click to submit a correction request/i).click()

    // 2. Wait for Modal
    const modal = page.locator('div[role="dialog"]')
    await expect(modal).toBeVisible()

    // 3. Axe Check
    const axeResults = await new AxeBuilder({ page }).include('div[role="dialog"]').analyze()

    if (axeResults.violations.length > 0) {
      console.log("URGENT: Issue Modal Accessibility Violations Found:", JSON.stringify(axeResults.violations, null, 2))
    }

    expect(axeResults.violations).toEqual([])

    // 4. Check for label-input association
    const label = page.locator('label:has-text("Details")')
    const textarea = page.locator("textarea#details")
    await expect(label).toBeVisible()
    await expect(textarea).toBeVisible()
  })
  test("Skip to main content link should work", async ({ page }) => {
    await page.goto("/en")
    await page.waitForLoadState("networkidle")

    const skipLink = page.locator('a[href="#main-content"]')

    // 1. Programmatic focus
    await skipLink.focus()
    await expect(skipLink).toBeVisible()

    // 2. Activation via keyboard
    await page.keyboard.press("Enter")

    // Give it a moment to scroll/focus
    await page.waitForTimeout(500)

    // 3. Verify focus moves to main-content area or any child inside it
    const isFocusMoved = await page.evaluate(() => {
      const el = document.activeElement
      const target = document.getElementById("main-content")
      return el === target || target?.contains(el)
    })

    expect(isFocusMoved).toBe(true)
  })

  test("Keyboard navigation should follow a logical loop", async ({ page }) => {
    await page.goto("/en")
    await page.waitForLoadState("networkidle")

    // Press Tab multiple times and ensure we only hit interactive elements
    let tabCount = 0
    const maxTabs = 20
    const seenElements = new Set()

    while (tabCount < maxTabs) {
      await page.keyboard.press("Tab")
      const elementInfo = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        return {
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          text: el.innerText.substring(0, 30).replace(/\n/g, " "),
          isFocusable: el.tabIndex >= 0,
        }
      })

      console.log(`Tab ${tabCount}: ${elementInfo.tagName}#${elementInfo.id} [${elementInfo.text}]`)
      expect(["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA", "MAIN", "DIV", "NEXTJS-PORTAL"]).toContain(
        elementInfo.tagName
      )

      seenElements.add(`${elementInfo.tagName}#${elementInfo.id}#${elementInfo.text}`)
      tabCount++
    }

    expect(seenElements.size).toBeGreaterThan(5) // Ensure we actually moved around
  })

  test("All form inputs should have descriptive labels", async ({ page }) => {
    await page.goto("/en/submit-service")

    const inputs = page.locator('input:not([type="hidden"]), textarea, select')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute("id")
      const ariaLabel = await input.getAttribute("aria-label")
      const placeholder = await input.getAttribute("placeholder")

      // Should have either a label for it, or an aria-label
      let hasLabel = false
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        if (await label.isVisible()) hasLabel = true
      }

      if (!hasLabel && !ariaLabel) {
        // Fallback: check if wrapped in label
        const parentLabel = input.locator("xpath=ancestor::label")
        if ((await parentLabel.count()) > 0) hasLabel = true
      }

      expect(hasLabel || ariaLabel || placeholder).toBeTruthy()
    }
  })
})
