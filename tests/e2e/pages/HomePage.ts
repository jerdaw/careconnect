import { Page, Locator, expect } from "@playwright/test"

export class HomePage {
  readonly page: Page
  readonly searchInput: Locator
  readonly crisisButton: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.getByPlaceholder(/search for help/i)
    this.crisisButton = page.getByRole("button", { name: /Crisis/i })
  }

  async goto() {
    await this.page.goto("/")
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press("Enter")
  }

  async clickCrisis() {
    await this.crisisButton.click()
  }

  async expectTitle() {
    await expect(this.page).toHaveTitle(/Kingston Care Connect/)
  }
}
