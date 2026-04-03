import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  delete process.env.NEXT_PUBLIC_BASE_URL
  vi.resetModules()
})

describe("metadata routes", () => {
  it("uses the careconnect fallback for robots", async () => {
    const { default: robots } = await import("@/app/robots")

    expect(robots().sitemap).toBe("https://careconnect.ing/sitemap.xml")
  })

  it("uses NEXT_PUBLIC_BASE_URL for robots and sitemap", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.test"
    const { default: robots } = await import("@/app/robots")
    const { default: sitemap } = await import("@/app/sitemap")

    const entries = await sitemap()

    expect(robots().sitemap).toBe("https://example.test/sitemap.xml")
    expect(entries[0]?.url).toBe("https://example.test/en")
    expect(entries[0]?.alternates?.languages?.fr).toBe("https://example.test/fr")
  })
})
