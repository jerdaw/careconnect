/** @vitest-environment node */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

type ManifestIcon = {
  src: string
  sizes?: string
  type?: string
  purpose?: string
}

type ManifestScreenshot = {
  src: string
  sizes?: string
  type?: string
  form_factor?: string
  label?: string
}

type WebManifest = {
  name: string
  short_name: string
  start_url: string
  scope?: string
  display?: string
  theme_color?: string
  background_color?: string
  icons?: ManifestIcon[]
  screenshots?: ManifestScreenshot[]
}

function getRepoRoot() {
  return process.cwd()
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T
}

function readPngSize(filePath: string): { width: number; height: number } {
  const buf = readFileSync(filePath)
  const signature = buf.subarray(0, 8)
  expect(Buffer.from(signature).toString("hex")).toBe("89504e470d0a1a0a")
  expect(buf.toString("ascii", 12, 16)).toBe("IHDR")
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  return { width, height }
}

function publicPathToDiskPath(publicPath: string): string {
  if (!publicPath.startsWith("/")) throw new Error(`Expected public path starting with "/": ${publicPath}`)
  return path.join(getRepoRoot(), "public", publicPath)
}

describe("PWA manifest assets", () => {
  it("manifest.json parses and references existing assets", () => {
    const manifestPath = path.join(getRepoRoot(), "public", "manifest.json")
    const manifest = readJson<WebManifest>(manifestPath)

    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBe("/")
    expect(manifest.scope).toBe("/")

    const icons = manifest.icons || []
    expect(icons.length).toBeGreaterThan(0)
    for (const icon of icons) {
      const diskPath = publicPathToDiskPath(icon.src)
      expect(existsSync(diskPath)).toBe(true)
    }

    const screenshots = manifest.screenshots || []
    expect(screenshots.length).toBeGreaterThan(0)
    for (const shot of screenshots) {
      const diskPath = publicPathToDiskPath(shot.src)
      expect(existsSync(diskPath)).toBe(true)
    }
  })

  it("key icon sizes match expected dimensions", () => {
    const expectations: Array<{ publicPath: string; width: number; height: number }> = [
      { publicPath: "/icons/favicon-16.png", width: 16, height: 16 },
      { publicPath: "/icons/favicon-32.png", width: 32, height: 32 },
      { publicPath: "/icons/apple-touch-icon.png", width: 180, height: 180 },
      { publicPath: "/icons/icon-192.png", width: 192, height: 192 },
      { publicPath: "/icons/icon-512.png", width: 512, height: 512 },
      { publicPath: "/icons/icon-maskable-192.png", width: 192, height: 192 },
      { publicPath: "/icons/icon-maskable-512.png", width: 512, height: 512 },
      { publicPath: "/icons/badge-72x72.png", width: 72, height: 72 },
      { publicPath: "/icons/shortcut-search-96.png", width: 96, height: 96 },
      { publicPath: "/icons/shortcut-crisis-96.png", width: 96, height: 96 },
      { publicPath: "/icons/shortcut-dashboard-96.png", width: 96, height: 96 },
    ]

    for (const exp of expectations) {
      const diskPath = publicPathToDiskPath(exp.publicPath)
      expect(existsSync(diskPath)).toBe(true)
      const size = readPngSize(diskPath)
      expect(size).toEqual({ width: exp.width, height: exp.height })
    }
  })

  it("screenshot sizes match expected dimensions", () => {
    const expectations: Array<{ publicPath: string; width: number; height: number }> = [
      { publicPath: "/screenshots/mobile-search.png", width: 540, height: 720 },
      { publicPath: "/screenshots/mobile-detail.png", width: 540, height: 720 },
      { publicPath: "/screenshots/tablet-search.png", width: 1280, height: 720 },
    ]

    for (const exp of expectations) {
      const diskPath = publicPathToDiskPath(exp.publicPath)
      expect(existsSync(diskPath)).toBe(true)
      const size = readPngSize(diskPath)
      expect(size).toEqual({ width: exp.width, height: exp.height })
    }
  })

  it("custom service worker uses store-quality icon paths", () => {
    const swPath = path.join(getRepoRoot(), "public", "custom-sw.js")
    const sw = readFileSync(swPath, "utf8")

    expect(sw).toContain("/icons/icon-192.png")
    expect(sw).toContain("/icons/badge-72x72.png")
    expect(sw).not.toContain('"/icon-192x192.png"')
    expect(sw).not.toContain('badge: "/badge-72x72.png"')
  })
})
