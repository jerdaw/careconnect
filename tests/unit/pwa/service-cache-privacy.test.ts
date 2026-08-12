import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("service API runtime cache privacy", () => {
  it("does not cache any service API response in the retirement release", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8")

    expect(config).not.toMatch(/cacheName:\s*["']services-api["']/)
    expect(config).not.toMatch(/cacheName:\s*["']services-export["']/)
    expect(config).not.toContain("urlPattern: /\\/api\\/v1\\/services")
  })
})
