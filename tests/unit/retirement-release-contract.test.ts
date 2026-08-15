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
    expect(nextConfig).toContain("NormalModuleReplacementPlugin")
    expect(nextConfig).toContain('path.join(retirementDataDirectory, "services.json")')
    expect(nextConfig).toContain('path.join(retirementDataDirectory, "embeddings.json")')
    expect(readRepoFile("package.json")).toContain("check:retirement-artifacts")
  })

  it("clears prior directory caches and offline service data during upgrade", () => {
    const worker = readRepoFile("public/retirement-cleanup-sw-20260815.js")

    for (const cacheName of [
      "services-api",
      "services-export",
      "json-cache",
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
    expect(worker).toContain("self.clients")
    expect(worker).toContain(".claim()")
    expect(worker).toContain('"kcc-vector-store"')
    expect(worker).toContain('"workbox-expiration"')
    expect(worker).toContain('"cache-entries"')
    expect(worker).toContain("client.navigate(retirementPathForClient(client.url))")
    expect(worker).toContain("self.registration.unregister()")
  })

  it("does not register a new long-lived worker and removes prior actionable screenshots", () => {
    const nextConfig = readRepoFile("next.config.ts")

    expect(nextConfig).toMatch(/register:\s*false/)
    expect(nextConfig).toContain('PUBLIC_SERVICE_MODE === "retired"')
    for (const oldScreenshot of ["mobile-detail.png", "mobile-search.png", "tablet-search.png"]) {
      expect(existsSync(path.join(process.cwd(), "public", "screenshots", oldScreenshot))).toBe(false)
    }
    for (const retirementScreenshot of ["retirement-mobile.png", "retirement-tablet.png"]) {
      expect(existsSync(path.join(process.cwd(), "public", "screenshots", retirementScreenshot))).toBe(true)
    }
  })

  it("cache-busts retirement worker logic and prevents intermediary worker caching", () => {
    const nextConfig = readRepoFile("next.config.ts")
    const retirementWorker = readRepoFile("public/sw.js")
    const compatibilityWorker = readRepoFile("public/custom-sw.js")

    expect(nextConfig).toContain('importScripts: ["/retirement-cleanup-sw-20260815.js"]')
    expect(nextConfig).not.toContain('importScripts: ["/custom-sw.js"]')
    expect(nextConfig).toContain('source: "/sw.js"')
    expect(nextConfig).toContain('{ key: "CDN-Cache-Control", value: "no-store" }')
    expect(nextConfig).toContain('{ key: "Service-Worker-Allowed", value: "/" }')
    expect(retirementWorker).toContain('importScripts("/retirement-cleanup-sw-20260815.js")')
    expect(retirementWorker).toContain("self.skipWaiting()")
    expect(retirementWorker).not.toContain("precacheAndRoute")
    expect(retirementWorker).not.toContain("workbox")
    expect(compatibilityWorker).toContain('importScripts("/retirement-cleanup-sw-20260815.js")')
  })
})
