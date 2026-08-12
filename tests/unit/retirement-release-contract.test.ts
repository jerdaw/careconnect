/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

describe("retirement release static contract", () => {
  it("does not advertise active directory shortcuts or a share target", () => {
    const manifest = JSON.parse(readRepoFile("public/manifest.json")) as Record<string, unknown>

    expect(manifest.name).toBe("CareConnect - Directory Retired")
    expect(manifest).not.toHaveProperty("share_target")
    expect(manifest).not.toHaveProperty("shortcuts")
  })

  it("does not create new service-response PWA caches", () => {
    const nextConfig = readRepoFile("next.config.ts")

    expect(nextConfig).not.toMatch(/cacheName:\s*["']services-api["']/)
    expect(nextConfig).not.toMatch(/cacheName:\s*["']services-export["']/)
  })

  it("clears prior directory caches and offline service data during upgrade", () => {
    const worker = readRepoFile("public/custom-sw.js")

    for (const cacheName of [
      "services-api",
      "services-export",
      "start-url",
      "offline-fallback",
      "pwa-assets",
      "next-static",
      "next-image",
      "workbox-precache",
    ]) {
      expect(worker).toContain(`"${cacheName}"`)
    }

    expect(worker).toContain("caches.delete(cacheName)")
    expect(worker).toContain("transaction.objectStore(storeName).clear()")
    expect(worker).toContain('"services", "embeddings", "meta"')
    expect(worker).not.toContain('"pendingFeedback"')
    expect(worker).toContain("indexedDB.deleteDatabase(databaseName)")
    expect(worker).toContain("self.clients.claim()")
  })

  it("does not register a new long-lived worker and removes prior actionable screenshots", () => {
    const nextConfig = readRepoFile("next.config.ts")

    expect(nextConfig).toMatch(/register:\s*false/)
    for (const oldScreenshot of ["mobile-detail.png", "mobile-search.png", "tablet-search.png"]) {
      expect(existsSync(path.join(process.cwd(), "public", "screenshots", oldScreenshot))).toBe(false)
    }
    for (const retirementScreenshot of ["retirement-mobile.png", "retirement-tablet.png"]) {
      expect(existsSync(path.join(process.cwd(), "public", "screenshots", retirementScreenshot))).toBe(true)
    }
  })
})
