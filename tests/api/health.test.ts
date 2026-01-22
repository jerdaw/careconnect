/** @vitest-environment node */
import { describe, it, expect } from "vitest"
import { GET } from "@/app/api/health/route"

describe("Health API Route", () => {
  it("returns ok and includes PWA checks", async () => {
    const response = await GET()
    expect(response.status).toBe(200)

    const json = (await response.json()) as any
    expect(json.status).toBe("ok")
    expect(json.pwa).toBeTruthy()
    expect(json.pwa.ok).toBe(true)
    expect(json.pwa.assetsOk).toBe(true)
    expect(json.pwa.checks.manifest.exists).toBe(true)
    expect(json.pwa.checks.customServiceWorker.exists).toBe(true)
  })
})
