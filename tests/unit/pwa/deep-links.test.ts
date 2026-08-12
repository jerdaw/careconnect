/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"

type AppleAppSiteAssociation = {
  applinks?: {
    details?: unknown[]
  }
}

describe("retired deep-link association files", () => {
  it("does not delegate retired public URLs to the Android application", () => {
    const assetLinksPath = path.join(process.cwd(), "public", ".well-known", "assetlinks.json")
    const assetLinks = JSON.parse(readFileSync(assetLinksPath, "utf8")) as unknown[]

    expect(assetLinks).toEqual([])
  })

  it("does not associate retired routes with the iOS application", () => {
    const aasaPath = path.join(process.cwd(), "public", ".well-known", "apple-app-site-association")
    const aasa = JSON.parse(readFileSync(aasaPath, "utf8")) as AppleAppSiteAssociation

    expect(aasa.applinks?.details).toEqual([])
  })
})
