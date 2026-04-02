import fs from "node:fs"
import path from "node:path"

const ROOT_DIR = process.cwd()

const ACTIVE_ROOTS = [
  ".github",
  "README.md",
  "AGENTS.md",
  "CONTRIBUTING.md",
  "scripts",
  "docs/api",
  "docs/architecture",
  "docs/architecture.md",
  "docs/deployment",
  "docs/development",
  "docs/governance",
  "docs/index.md",
  "docs/operations",
  "docs/runbooks",
  "docs/security",
  "docs/workflows",
] as const

const SCANNABLE_EXTENSIONS = new Set([".md", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".sh", ".yml", ".yaml", ".json"])
const GENERATED_PATH_PREFIXES = [
  "coverage/",
  "playwright-report/",
  ".next/",
  "test-results/",
  "dist/",
  "build/",
  "out/",
]
const GENERATED_PATHS = new Set(["docs/llms.txt"])
const REPO_PATH_PREFIXES = [".github", "docs", "scripts", "supabase", "tests", "data", "public", "app"]
const REPO_ROOT_FILES = [
  "AGENTS.md",
  "CHANGELOG.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "Dockerfile",
  "GEMINI.md",
  "LICENSE",
  "README.md",
  "SECURITY.md",
  "capacitor.config.ts",
  "middleware.ts",
  "mkdocs.yml",
  "next.config.ts",
  "package.json",
  "playwright.config.ts",
  "tsconfig.json",
  "vitest.config.mts",
] as const

const markdownLinkRegex = /\[[^\]]+\]\(([^)]+)\)/g
const backtickedPathRegex = /`([^`]+)`/g
const npmRunRegex = /\bnpm run ([a-zA-Z0-9:_-]+)/g
const launcherCommandPathRegex =
  /\b(?:node\s+--import\s+tsx|npx\s+tsx|bash)\s+([./A-Za-z0-9_*-]+(?:\/[A-Za-z0-9_*.-]+)+\/?)/g
const directCommandPathRegex = /(^|[\s(])(\.\/[A-Za-z0-9_*-]+(?:\/[A-Za-z0-9_*.-]+)+\/?)/gm
const markdownReferenceFileExtensions = new Set([".md", ".yml", ".yaml", ".sh"])

type ReferenceError = {
  file: string
  line: number
  type: "path" | "script"
  value: string
  message: string
}

function walk(targetPath: string, acc: string[]) {
  const fullPath = path.join(ROOT_DIR, targetPath)
  const stat = fs.statSync(fullPath)

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(fullPath)) {
      walk(path.join(targetPath, entry), acc)
    }
    return
  }

  if (targetPath.includes("/archive/") || targetPath.includes("_archive/")) {
    return
  }

  if (SCANNABLE_EXTENSIONS.has(path.extname(targetPath)) || path.basename(targetPath).startsWith(".")) {
    acc.push(targetPath)
  }
}

function collectFiles(): string[] {
  const files: string[] = []
  for (const target of ACTIVE_ROOTS) {
    walk(target, files)
  }
  return files.filter((file) => file !== "scripts/check-references.ts").sort()
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split("\n").length
}

function normalizePathCandidate(rawValue: string): string | null {
  const trimmed = rawValue.trim().replace(/^['"`<]+|[>'"`.,;:]+$/g, "")
  if (!trimmed || trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:")) {
    return null
  }
  if (
    trimmed.startsWith("#") ||
    trimmed.includes("*") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r") ||
    trimmed.includes("{") ||
    trimmed.includes("}")
  ) {
    return null
  }

  const [withoutAnchor] = trimmed.split("#")
  if (!withoutAnchor) {
    return null
  }

  const normalized = withoutAnchor.replace(/^\.\//, "")
  if (GENERATED_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return null
  }
  if (GENERATED_PATHS.has(normalized)) {
    return null
  }

  return normalized
}

function resolveReference(fromFile: string, reference: string): string {
  const normalized = reference.replace(/^\.\//, "")
  if (
    REPO_PATH_PREFIXES.some((prefix) => normalized.startsWith(`${prefix}/`)) ||
    REPO_ROOT_FILES.some((file) => normalized === file)
  ) {
    return path.resolve(ROOT_DIR, normalized)
  }

  const baseDir = path.dirname(path.join(ROOT_DIR, fromFile))
  return path.resolve(baseDir, reference)
}

function isRepoScopedReference(reference: string): boolean {
  return (
    REPO_PATH_PREFIXES.some((prefix) => reference.startsWith(`${prefix}/`) || reference.startsWith(`./${prefix}/`)) ||
    REPO_ROOT_FILES.some((file) => reference === file || reference === `./${file}`)
  )
}

function findReferenceErrors(file: string, scripts: Set<string>): ReferenceError[] {
  const fullPath = path.join(ROOT_DIR, file)
  const content = fs.readFileSync(fullPath, "utf8")
  const errors: ReferenceError[] = []
  const extension = path.extname(file)

  if (markdownReferenceFileExtensions.has(extension)) {
    for (const match of content.matchAll(markdownLinkRegex)) {
      const rawTarget = match[1]
      const normalized = normalizePathCandidate(rawTarget)
      if (!normalized) continue

      const resolvedPath = resolveReference(file, normalized)
      if (!resolvedPath.startsWith(ROOT_DIR)) continue
      if (GENERATED_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix))) continue

      if (!fs.existsSync(resolvedPath)) {
        errors.push({
          file,
          line: getLineNumber(content, match.index ?? 0),
          type: "path",
          value: rawTarget,
          message: `Missing linked path: ${normalized}`,
        })
      }
    }

    for (const match of content.matchAll(backtickedPathRegex)) {
      const rawTarget = match[1]
      const normalized = normalizePathCandidate(rawTarget)
      if (!normalized || !isRepoScopedReference(normalized)) continue

      const resolvedPath = resolveReference(file, normalized)
      if (!resolvedPath.startsWith(ROOT_DIR)) continue

      if (!fs.existsSync(resolvedPath)) {
        errors.push({
          file,
          line: getLineNumber(content, match.index ?? 0),
          type: "path",
          value: rawTarget,
          message: `Missing repo path: ${normalized}`,
        })
      }
    }
  }

  const commandMatches = [
    ...Array.from(content.matchAll(launcherCommandPathRegex), (match) => ({ index: match.index, rawTarget: match[1] })),
    ...Array.from(content.matchAll(directCommandPathRegex), (match) => ({ index: match.index, rawTarget: match[2] })),
  ]

  for (const match of commandMatches) {
    const rawTarget = match.rawTarget
    const normalized = normalizePathCandidate(rawTarget)
    if (!normalized || !isRepoScopedReference(normalized)) continue

    const resolvedPath = resolveReference(file, normalized)
    if (!resolvedPath.startsWith(ROOT_DIR)) continue

    if (!fs.existsSync(resolvedPath)) {
      errors.push({
        file,
        line: getLineNumber(content, match.index ?? 0),
        type: "path",
        value: rawTarget,
        message: `Missing command path: ${normalized}`,
      })
    }
  }

  for (const match of content.matchAll(npmRunRegex)) {
    const scriptName = match[1]
    if (!scripts.has(scriptName)) {
      errors.push({
        file,
        line: getLineNumber(content, match.index ?? 0),
        type: "script",
        value: scriptName,
        message: `Unknown npm script: ${scriptName}`,
      })
    }
  }

  return errors
}

function main() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf8")) as {
    scripts?: Record<string, string>
  }
  const scripts = new Set(Object.keys(packageJson.scripts ?? {}))
  const files = collectFiles()
  const errors = files.flatMap((file) => findReferenceErrors(file, scripts))

  if (errors.length === 0) {
    console.log(`Reference check passed across ${files.length} files.`)
    return
  }

  for (const error of errors) {
    console.error(`${error.file}:${error.line} ${error.message} (${error.value})`)
  }

  console.error(`\nReference check failed with ${errors.length} issue(s).`)
  process.exit(1)
}

main()
