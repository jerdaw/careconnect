import { test, expect } from "@playwright/test"
import { mockSupabase } from "./utils"
import { readFileSync } from "node:fs"
import path from "node:path"

function getEnSearchStrings() {
  const messagesPath = path.join(process.cwd(), "messages", "en.json")
  const messages = JSON.parse(readFileSync(messagesPath, "utf8")) as {
    Search?: { openNow?: string; crisis?: string }
  }

  if (!messages.Search?.openNow) throw new Error(`Missing Search.openNow in ${messagesPath}`)
  if (!messages.Search?.crisis) throw new Error(`Missing Search.crisis in ${messagesPath}`)

  return { openNow: messages.Search.openNow, crisis: messages.Search.crisis }
}

test("URL hydration sets query/category/openNow from params", async ({ page }) => {
  await mockSupabase(page)

  const { openNow, crisis } = getEnSearchStrings()

  await page.goto("/?q=food%20bank&category=Crisis&openNow=1")
  await page.waitForURL(/\/en/)

  const searchInput = page.locator('input[type="text"]').first()
  await expect(searchInput).toHaveValue("food bank")

  await expect(page.getByRole("button", { name: openNow })).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("button", { name: crisis })).toHaveAttribute("aria-pressed", "true")
})
