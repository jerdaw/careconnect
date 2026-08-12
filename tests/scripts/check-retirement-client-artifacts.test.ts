/** @vitest-environment node */
import { afterEach, describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

describe("retirement client artifact checker", () => {
  it("checks static chunks without requiring a service worker in CI-disabled PWA builds", () => {
    const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "careconnect-retirement-artifacts-"))
    temporaryDirectories.push(fixtureRoot)

    for (const directory of ["app", "components", "hooks", "lib", "i18n", "data", ".next/static", "public"]) {
      mkdirSync(path.join(fixtureRoot, directory), { recursive: true })
    }

    const services = Array.from({ length: 20 }, (_, index) => ({
      id: `fixture-service-${index.toString().padStart(2, "0")}`,
      name: `Fixture Service ${index.toString().padStart(2, "0")}`,
    }))
    const embeddings = {
      "fixture-service-00": Array.from({ length: 12 }, (_, index) => index / 10),
    }
    writeFileSync(path.join(fixtureRoot, "data/services.json"), JSON.stringify(services))
    writeFileSync(path.join(fixtureRoot, "data/embeddings.json"), JSON.stringify(embeddings))
    writeFileSync(path.join(fixtureRoot, ".next/static/safe.js"), "export const retired = true")

    const checkerPath = path.join(process.cwd(), "scripts/check-retirement-client-artifacts.ts")
    const tsxLoaderPath = createRequire(path.join(process.cwd(), "package.json")).resolve("tsx")
    const output = execFileSync(process.execPath, ["--import", tsxLoaderPath, checkerPath], {
      cwd: fixtureRoot,
      encoding: "utf8",
    })

    expect(output).toContain("Retirement artifact check passed across 1 generated files")
    expect(output).toContain("no service worker was generated in this build mode")
  })
})
