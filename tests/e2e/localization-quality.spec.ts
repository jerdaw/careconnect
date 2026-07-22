import { test, expect, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import path from "node:path"
import { mockSupabase } from "./utils"

const LOCALES = ["en", "fr", "zh-Hans", "ar", "pt", "es", "pa"] as const
const STATIC_ROUTES = [
  "",
  "/about",
  "/about/partners",
  "/settings",
  "/submit-service",
  "/privacy",
  "/accessibility",
  "/terms",
  "/content-policy",
  "/partner-terms",
  "/faq",
  "/user-guide",
  "/offline",
  "/service/brampton-safe-centre-of-peel",
  "/route-that-does-not-exist",
] as const
const MOBILE_ROUTES = ["", "/settings", "/service/brampton-safe-centre-of-peel"] as const
const RAW_KEY_PATTERN = /\b(?:[A-Z][A-Za-z0-9_-]*\.)+[A-Za-z][A-Za-z0-9_-]*\b/
const NO_JS_ROUTES = ["", "/offline", "/service/brampton-safe-centre-of-peel"] as const
const PLACEHOLDER_PATTERN = /\{[A-Za-z][A-Za-z0-9_]*(?:,\s*(?:plural|select)\b[^}]*)?\}/

type Locale = (typeof LOCALES)[number]
type LocaleMessages = {
  Home: {
    hero: { subtitle: string }
    stats: { servicesValue: string; categoriesValue: string; languagesValue: string }
  }
  Navigation: { language: string; openMenu: string }
  Search: { label: string }
  Feedback: { categories: Record<string, string> }
}

function getMessages(locale: Locale): LocaleMessages {
  return JSON.parse(readFileSync(path.join(process.cwd(), "messages", `${locale}.json`), "utf8")) as LocaleMessages
}

async function expectLocalizedDocument(page: Page, locale: Locale) {
  await expect(page.locator("html")).toHaveAttribute("lang", locale)
  await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr")

  const visibleText = await page.locator("body").innerText()
  expect(visibleText).not.toMatch(RAW_KEY_PATTERN)
  expect(visibleText).not.toMatch(PLACEHOLDER_PATTERN)
}

test.describe("Localization public-quality matrix", () => {
  test.describe.configure({ mode: "parallel" })

  for (const locale of LOCALES) {
    test(`${locale} public routes render localized chrome without raw keys`, async ({ page }) => {
      test.setTimeout(180_000)
      await mockSupabase(page)
      const hydrationErrors: string[] = []
      page.on("console", (message) => {
        if (
          message.type() === "error" &&
          /hydration|hydrated|did not match|server rendered html/i.test(message.text())
        ) {
          hydrationErrors.push(message.text())
        }
      })

      for (const route of STATIC_ROUTES) {
        const routePage = await page.context().newPage()
        await mockSupabase(routePage)
        routePage.on("console", (message) => {
          if (
            message.type() === "error" &&
            /hydration|hydrated|did not match|server rendered html/i.test(message.text())
          ) {
            hydrationErrors.push(message.text())
          }
        })
        await routePage.goto(`/${locale}${route}`, { waitUntil: "load" })
        await expectLocalizedDocument(routePage, locale)
        await routePage.close()
      }

      await page.goto(`/${locale}`, { waitUntil: "load" })
      const messages = getMessages(locale)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", messages.Home.hero.subtitle)
      await expect(page.getByText(messages.Home.stats.servicesValue, { exact: true })).toBeVisible()
      await expect(page.getByText(messages.Home.stats.categoriesValue, { exact: true })).toBeVisible()
      await expect(page.getByText(messages.Home.stats.languagesValue, { exact: true })).toBeVisible()
      expect(hydrationErrors).toEqual([])
    })

    for (const route of NO_JS_ROUTES) {
      const routeLabel = route === "" ? "homepage" : route.slice(1)
      test(`${locale} ${routeLabel} works without JavaScript`, async ({ browser }) => {
        const context = await browser.newContext({ javaScriptEnabled: false })
        const page = await context.newPage()
        try {
          await page.goto(`/${locale}${route}`, { waitUntil: "load" })
          await expectLocalizedDocument(page, locale)
        } finally {
          await context.close()
        }
      })
    }

    test(`${locale} representative mobile routes do not overflow or expose raw keys`, async ({ page }) => {
      for (const route of MOBILE_ROUTES) {
        const routePage = await page.context().newPage()
        await routePage.setViewportSize({ width: 390, height: 844 })
        await mockSupabase(routePage)
        await routePage.goto(`/${locale}${route}`, { waitUntil: "load" })
        await expectLocalizedDocument(routePage, locale)
        const overflow = await routePage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow).toBeLessThanOrEqual(1)
        await routePage.close()
      }
    })
  }

  for (const locale of LOCALES.filter((entry) => entry !== "en")) {
    test(`language switching preserves the nested route for ${locale}`, async ({ page }) => {
      await mockSupabase(page)
      const english = getMessages("en")
      const target = getMessages(locale)

      await page.goto("/en/settings", { waitUntil: "load" })
      if ((page.viewportSize()?.width ?? 1280) < 1024) {
        await page.getByRole("button", { name: english.Navigation.openMenu }).click()
      }
      await page.getByRole("button", { name: english.Navigation.language }).last().click()
      await page.locator(`[data-locale="${locale}"]`).click()

      await expect(page).toHaveURL(new RegExp(`/${locale}/settings$`))
      await expect(page.locator("html")).toHaveAttribute("lang", locale)
      if ((page.viewportSize()?.width ?? 1280) < 1024) {
        await page.getByRole("button", { name: target.Navigation.openMenu }).click()
      }
      await expect(page.getByRole("button", { name: target.Navigation.language }).last()).toBeVisible()
    })
  }
})
