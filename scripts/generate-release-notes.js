#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generate GitHub release notes from CHANGELOG.md
 * Extracts content for a specific version and formats it for GitHub releases
 */

const fs = require("fs")
const path = require("path")

const CHANGELOG_PATH = path.join(process.cwd(), "CHANGELOG.md")

/**
 * Parse CHANGELOG.md and extract release notes for a specific version
 * @param {string} version - Version to extract (e.g., "0.17.5" or "v0.17.5")
 * @returns {object} Release notes with title, body, and metadata
 */
function extractReleaseNotes(version) {
  // Normalize version (remove v prefix if present)
  const normalizedVersion = version.startsWith("v") ? version.slice(1) : version

  // Read changelog
  const changelog = fs.readFileSync(CHANGELOG_PATH, "utf8")

  // Find the version section
  const versionRegex = new RegExp(`## \\[${normalizedVersion}\\].*?\n`)
  const match = changelog.match(versionRegex)

  if (!match) {
    throw new Error(`Version ${normalizedVersion} not found in CHANGELOG.md`)
  }

  const versionStart = match.index + match[0].length
  const remainingContent = changelog.slice(versionStart)

  // Find the next version section or end of file
  const nextVersionMatch = remainingContent.match(/^## \[/m)
  const versionEnd = nextVersionMatch ? nextVersionMatch.index : remainingContent.length

  const releaseContent = remainingContent.slice(0, versionEnd).trim()

  // Extract date if present
  const dateMatch = match[0].match(/\d{4}-\d{2}-\d{2}/)
  const releaseDate = dateMatch ? dateMatch[0] : null

  // Parse content into sections
  const sections = parseContentSections(releaseContent)

  return {
    version: normalizedVersion,
    date: releaseDate,
    title: `v${normalizedVersion}`,
    body: releaseContent,
    sections,
  }
}

/**
 * Parse release content into structured sections
 * @param {string} content - Release content from changelog
 * @returns {object} Structured sections (added, changed, fixed, etc.)
 */
function parseContentSections(content) {
  const sections = {
    added: [],
    changed: [],
    fixed: [],
    removed: [],
    deprecated: [],
    security: [],
    other: [],
  }

  const lines = content.split("\n")
  let currentSection = "other"

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Detect section headers
    if (trimmedLine.startsWith("### Added")) {
      currentSection = "added"
      continue
    } else if (trimmedLine.startsWith("### Changed")) {
      currentSection = "changed"
      continue
    } else if (trimmedLine.startsWith("### Fixed")) {
      currentSection = "fixed"
      continue
    } else if (trimmedLine.startsWith("### Removed")) {
      currentSection = "removed"
      continue
    } else if (trimmedLine.startsWith("### Deprecated")) {
      currentSection = "deprecated"
      continue
    } else if (trimmedLine.startsWith("### Security")) {
      currentSection = "security"
      continue
    }

    // Add content to current section
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      sections[currentSection].push(trimmedLine)
    }
  }

  return sections
}

/**
 * Format release notes for GitHub
 * @param {object} notes - Release notes object from extractReleaseNotes
 * @param {object} options - Formatting options
 * @returns {string} Formatted release notes
 */
function formatForGitHub(notes, options = {}) {
  const { includeFooter = true, includeEmoji = true } = options

  let formatted = ""

  // Add date if available
  if (notes.date) {
    formatted += `**Release Date:** ${notes.date}\n\n`
  }

  // Add main content
  formatted += notes.body

  // Add footer
  if (includeFooter) {
    formatted += "\n\n---\n\n"
    formatted += "**Full Changelog:** "
    formatted += `https://github.com/OWNER/REPO/blob/main/CHANGELOG.md#${notes.version.replace(/\./g, "")}\n\n`

    if (includeEmoji) {
      formatted += "🙏 **Thank you** to all contributors who made this release possible!\n"
    }
  }

  return formatted
}

/**
 * Get the latest version from CHANGELOG.md
 * @returns {string} Latest version number
 */
function getLatestVersion() {
  const changelog = fs.readFileSync(CHANGELOG_PATH, "utf8")
  const match = changelog.match(/^## \[([^\]]+)\]/m)

  if (!match) {
    throw new Error("No version found in CHANGELOG.md")
  }

  return match[1]
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node scripts/generate-release-notes.js [version] [options]

Generate GitHub release notes from CHANGELOG.md

Arguments:
  version           Version to generate notes for (e.g., 0.17.5 or v0.17.5)
                    If not provided, uses the latest version from CHANGELOG.md

Options:
  --no-footer       Don't include footer with changelog link
  --no-emoji        Don't include emoji in footer
  --output <file>   Write output to file instead of stdout
  --json            Output structured JSON instead of markdown
  --help, -h        Show this help message

Examples:
  node scripts/generate-release-notes.js v0.17.5
  node scripts/generate-release-notes.js 0.17.5 --output release-notes.md
  node scripts/generate-release-notes.js --json
`)
    process.exit(0)
  }

  try {
    // Parse arguments
    const versionArg = args.find((arg) => !arg.startsWith("--"))
    const version = versionArg || getLatestVersion()

    const options = {
      includeFooter: !args.includes("--no-footer"),
      includeEmoji: !args.includes("--no-emoji"),
    }

    const outputFile = args.includes("--output") ? args[args.indexOf("--output") + 1] : null
    const jsonOutput = args.includes("--json")

    // Generate notes
    const notes = extractReleaseNotes(version)

    // Output
    if (jsonOutput) {
      const output = JSON.stringify(notes, null, 2)
      if (outputFile) {
        fs.writeFileSync(outputFile, output)
        console.log(`Release notes written to ${outputFile}`)
      } else {
        console.log(output)
      }
    } else {
      const formatted = formatForGitHub(notes, options)
      if (outputFile) {
        fs.writeFileSync(outputFile, formatted)
        console.log(`Release notes written to ${outputFile}`)
      } else {
        console.log(formatted)
      }
    }

    process.exit(0)
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

module.exports = {
  extractReleaseNotes,
  formatForGitHub,
  getLatestVersion,
  parseContentSections,
}
