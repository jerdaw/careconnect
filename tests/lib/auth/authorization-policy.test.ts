import fs from "fs"
import path from "path"
import ts from "typescript"
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
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const findings: Array<{ file: string; helper: string; line: number }> = []

      function visit(node: ts.Node) {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          highRiskAuthorizationHelpers.includes(node.expression.text) &&
          node.arguments.some((argument) => ts.isStringLiteral(argument) && argument.text === "low")
        ) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          findings.push({
            file: path.relative(process.cwd(), file),
            helper: node.expression.text,
            line: line + 1,
          })
        }

        ts.forEachChild(node, visit)
      }

      visit(sourceFile)

      return findings
    })
  )
}

describe("authorization risk policy", () => {
  it("does not use low-risk fail-open mode for admin or mutation authorization helpers", () => {
    expect(findLowRiskAuthorizationCalls()).toEqual([])
  })
})
