import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"

import { readFileSync } from "node:fs"
import path from "node:path"

const LOCALES = ["en", "fr", "zh-Hans", "ar", "pt", "es", "pa"] as const

function getOfflineTitle(locale: (typeof LOCALES)[number]) {
  const messagesPath = path.join(process.cwd(), "messages", `${locale}.json`)
  const messages = JSON.parse(readFileSync(messagesPath, "utf8")) as { Offline?: { title?: string } }
  if (!messages.Offline?.title) throw new Error(`Missing Offline.title in ${messagesPath}`)
  return messages.Offline.title
}

test.describe("Offline route", () => {
  for (const locale of LOCALES) {
    test(`resolves /offline for locale ${locale}`, async ({ page, context }) => {
      await mockSupabase(page)

      await context.addCookies([
        {
          name: "NEXT_LOCALE",
          value: locale,
          url: "http://localhost:3000",
        },
      ])

      await page.goto("/offline")
      await page.waitForLoadState("domcontentloaded")

      await expect(page.locator("html")).toHaveAttribute("lang", locale)
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr")

      const title = getOfflineTitle(locale)
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
    })
  }
})

test.skip("Service worker is registered (manual)", async () => {
  // PWA is disabled in dev and CI in this repo; SW registration is a manual check during release verification.
})
