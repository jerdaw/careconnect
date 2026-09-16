/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import path from "node:path"
import { MockerRegistry } from "@vitest/mocker"
import { interceptorPlugin } from "@vitest/mocker/node"
import { resolveConfig, type ViteDevServer } from "vite"

const require = createRequire(import.meta.url)
const AdmZip = require("adm-zip")
const temporaryDirectories: string[] = []

function temporaryDirectory() {
  const directory = mkdtempSync(path.join(tmpdir(), "careconnect-dependency-security-"))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe("patched native dependencies", () => {
  it("resolves patched sharp for both Next and Transformers and preserves native image decoding", async () => {
    const transformersRequire = createRequire(require.resolve("@huggingface/transformers"))
    const nextRequire = createRequire(require.resolve("next"))
    expect(transformersRequire.resolve("sharp")).toBe(nextRequire.resolve("sharp"))
    const sharp = transformersRequire("sharp")
    expect(sharp.versions.sharp).toBe("0.35.4")
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } })
      .png()
      .toBuffer()
    const { RawImage, pipeline } = require("@huggingface/transformers")
    expect(typeof pipeline).toBe("function")
    const image = await RawImage.fromBlob(new Blob([png], { type: "image/png" }))
    expect([image.width, image.height]).toEqual([2, 2])
  })

  for (const method of ["entry", "all", "async"] as const) {
    for (const linkKind of ["file", "directory"] as const) {
      it(`rejects ${linkKind} destination symlinks with overwrite enabled (${method})`, async () => {
        const root = temporaryDirectory()
        const target = path.join(root, "target")
        const outside = path.join(root, "outside")
        mkdirSync(target)
        mkdirSync(outside)
        const sentinel = path.join(outside, "payload.txt")
        writeFileSync(sentinel, "unchanged")
        const entry = linkKind === "directory" ? "link/payload.txt" : "payload.txt"
        symlinkSync(
          linkKind === "directory" ? outside : sentinel,
          path.join(target, linkKind === "directory" ? "link" : entry)
        )
        const zip = new AdmZip()
        zip.addFile(entry, Buffer.from("overwritten"))

        if (method === "entry") {
          expect(() => zip.extractEntryTo(entry, target, true, true)).toThrow()
        } else if (method === "all") {
          expect(() => zip.extractAllTo(target, true)).toThrow()
        } else {
          await expect(
            new Promise<void>((resolve, reject) => {
              zip.extractAllToAsync(target, true, false, (error: Error | null) => (error ? reject(error) : resolve()))
            })
          ).rejects.toThrow()
        }
        expect(readFileSync(sentinel, "utf8")).toBe("unchanged")
      })
    }

    it(`preserves normal extraction with overwrite enabled (${method})`, async () => {
      const root = temporaryDirectory()
      const zip = new AdmZip()
      zip.addFile("payload.txt", Buffer.from("updated"))
      writeFileSync(path.join(root, "payload.txt"), "old")
      if (method === "entry") zip.extractEntryTo("payload.txt", root, false, true)
      else if (method === "all") zip.extractAllTo(root, true)
      else
        await new Promise<void>((resolve, reject) => {
          zip.extractAllToAsync(root, true, false, (error: Error | null) => (error ? reject(error) : resolve()))
        })
      expect(readFileSync(path.join(root, "payload.txt"), "utf8")).toBe("updated")
    })
  }
})

describe("patched mock redirect registration", () => {
  it("rejects opaque-scheme traversal and denied in-root files while allowing normal redirects", async () => {
    const root = temporaryDirectory()
    writeFileSync(path.join(root, "allowed.js"), "export default 1")
    writeFileSync(path.join(root, "denied.txt"), "synthetic fixture, not a secret")
    const config = await resolveConfig(
      { configFile: false, root, server: { fs: { strict: true, allow: [root], deny: ["**/denied.txt"] } } },
      "serve"
    )
    const registry = new MockerRegistry()
    const plugin = interceptorPlugin({ registry })
    const handlers = new Map<string, (event: object) => void>()
    const server = {
      config,
      ws: { on: (name: string, handler: (event: object) => void) => handlers.set(name, handler), send: vi.fn() },
    }
    const configure = plugin.configureServer as (server: ViteDevServer) => void
    configure(server as unknown as ViteDevServer)
    const register = handlers.get("vitest:interceptor:register")!
    for (const [id, redirect] of [
      ["escape", "opaque:../../outside.txt"],
      ["denied", "file:///denied.txt"],
      ["allowed", "file:///allowed.js"],
    ]) {
      register({ type: "redirect", raw: id, id, url: `/${id}`, redirect })
    }
    expect(registry.getById("escape")).toBeUndefined()
    expect(registry.getById("denied")).toBeUndefined()
    expect(registry.getById("allowed")).toMatchObject({ redirect: path.join(root, "allowed.js") })
  })
})
