import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("service API runtime cache privacy", () => {
  it("excludes query-bearing service searches from Workbox caching", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8")

    expect(config).toContain("/\\/api\\/v1\\/services(?!\\/export)(?![^#]*[?&]q=)(\\/|$)/")
    expect(config).not.toContain("urlPattern: /\\/api\\/v1\\/services(?!\\/export)(\\/|$)/")
  })
})
