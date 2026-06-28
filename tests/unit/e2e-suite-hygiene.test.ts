/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

const defaultE2eRoot = path.join(process.cwd(), "tests/e2e")
const optInSuites = new Set(["prod", "server"])
const skipPattern = /\b(?:test|describe|it)\.skip\b/

function collectDefaultE2eFiles(dir: string): string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir)) {
    if (optInSuites.has(entry)) {
      continue
    }

    const absPath = path.join(dir, entry)
    const stat = statSync(absPath)

    if (stat.isDirectory()) {
      files.push(...collectDefaultE2eFiles(absPath))
      continue
    }

    if (/\.(?:ts|tsx)$/.test(entry)) {
      files.push(absPath)
    }
  }

  return files.sort()
}

describe("default E2E suite hygiene", () => {
  it("keeps the default Playwright suite free of inline skips", () => {
    for (const filePath of collectDefaultE2eFiles(defaultE2eRoot)) {
      const relPath = path.relative(process.cwd(), filePath)
      expect(readFileSync(filePath, "utf8"), relPath).not.toMatch(skipPattern)
    }
  })
})
