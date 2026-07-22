import { test, expect } from "@playwright/test"

test("service worker is registered in the production browser flow", async ({ page }) => {
  await page.goto("/en")
  await page.waitForLoadState("domcontentloaded")

  const registration = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return null
    const ready = await navigator.serviceWorker.ready
    const worker = ready.active
    if (worker && worker.state !== "activated") {
      await new Promise<void>((resolve) => {
        worker.addEventListener("statechange", () => {
          if (worker.state === "activated") resolve()
        })
      })
    }
    return {
      scope: ready.scope,
      activeState: ready.active?.state ?? null,
      scriptURL: ready.active?.scriptURL ?? null,
    }
  })

  expect(registration).toEqual({
    scope: "http://localhost:3000/",
    activeState: "activated",
    scriptURL: "http://localhost:3000/sw.js",
  })
})
