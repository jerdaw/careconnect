#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Compare bundle sizes between current build and baseline (main branch)
 * Generates a markdown report showing size differences
 */

const fs = require("fs")
const path = require("path")

const CURRENT_BUNDLE_PATH = path.join(process.cwd(), ".next/analyze/__bundle_analysis.json")
const BASELINE_BUNDLE_PATH = path.join(process.cwd(), ".next/analyze/baseline/__bundle_analysis.json")
const OUTPUT_PATH = path.join(process.cwd(), ".next/analyze/bundle-diff.md")

// Size thresholds for warnings (in bytes)
const WARN_INCREASE_BYTES = 10 * 1024 // 10 KB
const WARN_INCREASE_PERCENT = 5 // 5%

function formatBytes(bytes) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

function formatDiff(current, baseline) {
  const diff = current - baseline
  const percent = baseline === 0 ? 0 : ((diff / baseline) * 100).toFixed(2)
  const sign = diff > 0 ? "+" : ""

  let emoji = "📊"
  if (diff > WARN_INCREASE_BYTES || parseFloat(percent) > WARN_INCREASE_PERCENT) {
    emoji = "⚠️"
  } else if (diff < 0) {
    emoji = "✅"
  }

  return {
    diff,
    percent,
    sign,
    emoji,
    formatted: `${sign}${formatBytes(Math.abs(diff))} (${sign}${percent}%)`,
  }
}

function loadBundleData(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8")
    return JSON.parse(data)
  } catch {
    return null
  }
}

function setGitHubOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return
  }

  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value)}\n`)
}

function isSignificantChange(diff) {
  return Math.abs(diff.diff) > WARN_INCREASE_BYTES || Math.abs(parseFloat(diff.percent)) > WARN_INCREASE_PERCENT
}

function isActionableRegression(diff) {
  return diff.diff > WARN_INCREASE_BYTES || parseFloat(diff.percent) > WARN_INCREASE_PERCENT
}

function compareBundles() {
  const current = loadBundleData(CURRENT_BUNDLE_PATH)
  const baseline = loadBundleData(BASELINE_BUNDLE_PATH)

  if (!current) {
    console.error("Current bundle analysis not found!")
    process.exit(1)
  }

  if (!baseline) {
    console.log("No baseline bundle analysis found. This is the first build or baseline is unavailable.")
    console.log("Bundle analysis will be stored for future comparisons.")
    return null
  }

  // Compare global bundle sizes
  const currentGlobal = current.__global || { raw: 0, gzip: 0 }
  const baselineGlobal = baseline.__global || { raw: 0, gzip: 0 }

  const rawDiff = formatDiff(currentGlobal.raw, baselineGlobal.raw)
  const gzipDiff = formatDiff(currentGlobal.gzip, baselineGlobal.gzip)

  // Compare page-level bundles
  const pages = new Set([...Object.keys(current), ...Object.keys(baseline)])
  pages.delete("__global")

  const pageComparisons = Array.from(pages)
    .map((page) => {
      const currentPage = current[page] || { raw: 0, gzip: 0 }
      const baselinePage = baseline[page] || { raw: 0, gzip: 0 }

      const pageDiff = formatDiff(currentPage.gzip, baselinePage.gzip)

      return {
        page,
        current: currentPage.gzip,
        baseline: baselinePage.gzip,
        diff: pageDiff,
      }
    })
    .sort((a, b) => Math.abs(b.diff.diff) - Math.abs(a.diff.diff))

  // Generate markdown report
  let report = "## 📦 Bundle Size Analysis\n\n"

  // Overall summary
  report += "### Global Bundle\n\n"
  report += "| Metric | Current | Baseline | Diff |\n"
  report += "|--------|---------|----------|------|\n"
  report += `| Raw | ${formatBytes(currentGlobal.raw)} | ${formatBytes(baselineGlobal.raw)} | ${rawDiff.emoji} ${rawDiff.formatted} |\n`
  report += `| Gzipped | ${formatBytes(currentGlobal.gzip)} | ${formatBytes(baselineGlobal.gzip)} | ${gzipDiff.emoji} ${gzipDiff.formatted} |\n\n`

  const significantRegressions = pageComparisons.filter((p) => p.diff.diff > 0 && isActionableRegression(p.diff))
  const significantImprovements = pageComparisons.filter((p) => p.diff.diff < 0 && isSignificantChange(p.diff))
  const hasActionableRegression = isActionableRegression(gzipDiff) || significantRegressions.length > 0

  if (hasActionableRegression) {
    report += "### Status\n\n"
    report += "⚠️ Action required: detected a significant gzipped bundle regression.\n\n"
  } else {
    report += "### Status\n\n"
    report += "✅ No actionable gzipped bundle regression detected.\n\n"
  }

  if (significantRegressions.length > 0) {
    report += "### ⚠️ Significant Regressions\n\n"
    report += "| Page | Current (gzip) | Baseline (gzip) | Diff |\n"
    report += "|------|----------------|-----------------|------|\n"
    significantRegressions.forEach((p) => {
      report += `| \`${p.page}\` | ${formatBytes(p.current)} | ${formatBytes(p.baseline)} | ${p.diff.emoji} ${p.diff.formatted} |\n`
    })
    report += "\n"
  }

  if (significantImprovements.length > 0) {
    report += "### ✅ Significant Improvements\n\n"
    report += "| Page | Current (gzip) | Baseline (gzip) | Diff |\n"
    report += "|------|----------------|-----------------|------|\n"
    significantImprovements.forEach((p) => {
      report += `| \`${p.page}\` | ${formatBytes(p.current)} | ${formatBytes(p.baseline)} | ${p.diff.emoji} ${p.diff.formatted} |\n`
    })
    report += "\n"
  }

  // Top 5 largest pages
  const largestPages = pageComparisons.sort((a, b) => b.current - a.current).slice(0, 5)

  report += "### 📊 Largest Pages (Top 5)\n\n"
  report += "| Page | Size (gzip) | Diff |\n"
  report += "|------|-------------|------|\n"
  largestPages.forEach((p) => {
    report += `| \`${p.page}\` | ${formatBytes(p.current)} | ${p.diff.emoji} ${p.diff.formatted} |\n`
  })
  report += "\n"

  if (hasActionableRegression) {
    report += "### ⚠️ Warning\n\n"
    report += `Bundle size increased significantly. Consider:\n`
    report += `- Reviewing new dependencies added\n`
    report += `- Checking for duplicate packages\n`
    report += `- Using dynamic imports for large components\n`
    report += `- Optimizing images and assets\n\n`
  } else if (gzipDiff.diff < 0) {
    report += "### ✅ Good Job!\n\n"
    report += `Bundle size decreased! Nice optimization work.\n\n`
  }

  report += `---\n`
  report += `*Generated by bundle size analyzer*\n`

  // Write report
  fs.writeFileSync(OUTPUT_PATH, report)
  console.log("Bundle comparison report generated at:", OUTPUT_PATH)
  console.log("\n" + report)

  return { hasActionableRegression }
}

// Run comparison
try {
  const result = compareBundles()

  if (result === null) {
    // No baseline, write a simple message
    const message =
      "## 📦 Bundle Size Analysis\n\n✅ Bundle analysis complete. No baseline for comparison.\n\nThis will serve as the baseline for future PRs.\n"
    fs.writeFileSync(OUTPUT_PATH, message)
    console.log(message)
    setGitHubOutput("should_comment", false)
    process.exit(0)
  }

  setGitHubOutput("should_comment", result.hasActionableRegression)

  process.exit(0)
} catch (err) {
  console.error("Error comparing bundle sizes:", err)
  process.exit(1)
}
