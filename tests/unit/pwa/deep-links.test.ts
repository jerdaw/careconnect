/** @vitest-environment node */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"

type AssetLinksEntry = {
  relation: string[]
  target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] }
}

type AppleAppSiteAssociation = {
  applinks?: {
    details?: Array<{
      appIDs?: string[]
      components?: Array<Record<string, unknown>>
    }>
  }
}

describe("Deep link association files", () => {
  it("assetlinks.json package_name matches Capacitor appId", async () => {
    const assetLinksPath = path.join(process.cwd(), "public", ".well-known", "assetlinks.json")
    const assetLinks = JSON.parse(readFileSync(assetLinksPath, "utf8")) as AssetLinksEntry[]

    const capConfigPath = path.join(process.cwd(), "capacitor.config.ts")
    const capConfig = readFileSync(capConfigPath, "utf8")

    // lightweight check without executing TS
    const match = capConfig.match(/appId:\s*\"([^\"]+)\"/)
    expect(match?.[1]).toBeTruthy()
    const appId = match?.[1] as string

    expect(assetLinks[0]?.target?.package_name).toBe(appId)
  })

  it("apple-app-site-association matches current routes", () => {
    const aasaPath = path.join(process.cwd(), "public", ".well-known", "apple-app-site-association")
    const aasa = JSON.parse(readFileSync(aasaPath, "utf8")) as AppleAppSiteAssociation

    const components = aasa.applinks?.details?.[0]?.components || []
    const patterns = components.map((c) => String((c as any)["/"] || ""))

    // Current app route is `/[locale]/service/[id]` (singular).
    expect(patterns.some((p) => p.includes("/*/service/"))).toBe(true)
    expect(patterns.some((p) => p.includes("/*/services/"))).toBe(false)
  })
})
