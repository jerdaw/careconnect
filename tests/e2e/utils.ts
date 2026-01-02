import { Page } from "@playwright/test"
import servicesFixture from "./fixtures/services.json"

export async function mockSupabase(page: Page) {
  // Mock Services Table Query
  await page.route("**/rest/v1/services*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(servicesFixture),
    })
  })

  // Mock all other Supabase REST requests to prevent polling/timeouts
  await page.route("**/rest/v1/**", async (route) => {
      // Fallback for non-services requests (e.g. auth, other tables)
      await route.fulfill({ status: 200, body: JSON.stringify([]) }) 
  })
  
  // Create a proper auth session mock if needed, or just block auth endpoints
  await page.route("**/auth/v1/**", async (route) => {
       await route.fulfill({ status: 200, body: JSON.stringify({ user: null }) })
  })

  // Block Analytics to prevent noise/errors
  await page.route("**/api/v1/analytics/**", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
  })

  // Block Embeddings pipeline if it happens clientside (legacy)
  await page.route("**/pipeline/*", async (route) => {
    await route.abort()
  })
}
