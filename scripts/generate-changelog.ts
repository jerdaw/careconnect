#!/usr/bin/env npx tsx
import { execSync } from "child_process"
import { appendFileSync, existsSync, writeFileSync } from "fs"

const CHANGELOG_PATH = "data/changelog.md"

// Ensure changelog exists
if (!existsSync(CHANGELOG_PATH)) {
  writeFileSync(CHANGELOG_PATH, "# Service Data Changelog\n\n")
}

try {
  const diff = execSync("git diff HEAD~1 data/services.json || true", { encoding: "utf-8" })
  if (!diff.trim()) {
    console.log("No changes detected in services.json")
    process.exit(0)
  }

  const date = new Date().toISOString().split("T")[0]
  // Limit diff size to avoid huge files
  const truncatedDiff = diff.slice(0, 2000) + (diff.length > 2000 ? "\n... (truncated)" : "")
  const entry = `\n## ${date}\n\n\`\`\`diff\n${truncatedDiff}\n\`\`\`\n`

  appendFileSync(CHANGELOG_PATH, entry)
  console.log("📝 Changelog updated.")
} catch (error) {
  console.error("Failed to generate changelog:", error)
}
