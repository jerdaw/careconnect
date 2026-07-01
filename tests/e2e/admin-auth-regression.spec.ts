import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

test.use({ screenshot: "off", trace: "off", video: "off" })

test.describe("Admin auth regression smoke", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
    await page.route("**/api/admin/data", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            services: [
              {
                id: "service-1",
                name: "Regression Test Service",
                description: "A local-only admin regression fixture",
                url: "https://example.org",
                phone: "555-0100",
                address: "1 Test Street",
                intent_category: "Food",
                verification_level: "L1",
                synthetic_queries: ["food help"],
                identity_tags: [],
                provenance: {
                  verified_by: "test",
                  verified_at: "2026-06-30T00:00:00Z",
                  evidence_url: "https://example.org",
                  method: "test",
                },
              },
            ],
          },
        }),
      })
    })
    await page.route("**/api/admin/reindex/proof", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            runningJob: { observed: false },
            processOverlap: { observed: false },
            cooldown: { observed: true },
            timeout: { configured: true },
            actionLog: { observed: true },
          },
        }),
      })
    })
  })

  test("admin page renders the standard data envelope without client exceptions", async ({ page }) => {
    const clientErrors: string[] = []
    page.on("pageerror", (error) => clientErrors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") {
        clientErrors.push(message.text())
      }
    })

    await page.goto("/en/admin")

    await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible()
    await expect(page.getByText("Regression Test Service")).toBeVisible()
    expect(clientErrors).toEqual([])
  })
})
