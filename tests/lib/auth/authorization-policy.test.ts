import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

const highRiskAuthorizationHelpers = ["assertAdminRole", "assertPermission", "assertServiceOwnership"]
const sourceRoots = ["app", "lib", "scripts"]
const sourceExtensions = new Set([".ts", ".tsx"])

function listSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (["node_modules", ".next", "coverage"].includes(entry.name)) return []
      return listSourceFiles(fullPath)
    }

    return sourceExtensions.has(path.extname(entry.name)) ? [fullPath] : []
  })
}

function findLowRiskAuthorizationCalls() {
  return sourceRoots.flatMap((root) =>
    listSourceFiles(path.join(process.cwd(), root)).flatMap((file) => {
      const source = fs.readFileSync(file, "utf8")
      const findings = highRiskAuthorizationHelpers.flatMap((helper) => {
        const callPattern = new RegExp(`${helper}\\([\\s\\S]*?["']low["']`, "g")
        return [...source.matchAll(callPattern)].map((match) => ({
          file: path.relative(process.cwd(), file),
          helper,
          line: source.slice(0, match.index).split(/\r?\n/).length,
        }))
      })

      return findings
    })
  )
}

describe("authorization risk policy", () => {
  it("does not use low-risk fail-open mode for admin or mutation authorization helpers", () => {
    expect(findLowRiskAuthorizationCalls()).toEqual([])
  })
})
