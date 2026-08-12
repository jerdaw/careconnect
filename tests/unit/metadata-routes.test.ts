import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  delete process.env.NEXT_PUBLIC_BASE_URL
  vi.resetModules()
})

describe("metadata routes", () => {
  it("disallows crawling and omits the sitemap in retirement mode", async () => {
    const { default: robots } = await import("@/app/robots")

    expect(robots()).toEqual({
      rules: [{ userAgent: "*", disallow: "/" }],
    })
  })

  it("returns an empty retirement sitemap if fetched directly", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.test"
    const { default: robots } = await import("@/app/robots")
    const { default: sitemap } = await import("@/app/sitemap")

    const entries = await sitemap()

    expect(robots().sitemap).toBeUndefined()
    expect(entries).toEqual([])
  })

  it("preserves the prior crawler contract only for a recorded release rollback", async () => {
    const { buildRobots } = await import("@/app/robots")
    const { buildSitemap } = await import("@/app/sitemap")

    expect(buildRobots("active").sitemap).toBe("https://careconnect.ing/sitemap.xml")
    expect((await buildSitemap("active")).some((entry) => entry.url.includes("/service/"))).toBe(true)
  })
})
