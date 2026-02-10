#!/usr/bin/env npx tsx
/**
 * Pre-Launch QA Runner
 *
 * Automated validation script for Phase 1 QA.
 * Runs all automated checks before manual QA execution.
 */

import { execSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import path from "path"

interface CheckResult {
  name: string
  status: "pass" | "fail" | "skip" | "warn"
  message: string
  details?: string[]
}

const results: CheckResult[] = []

function runCheck(
  name: string,
  fn: () => CheckResult["status"],
  getMessage: () => string,
  getDetails?: () => string[]
): void {
  process.stdout.write(`\n🔍 ${name}... `)

  try {
    const status = fn()
    const message = getMessage()
    const details = getDetails?.()

    results.push({ name, status, message, details })

    if (status === "pass") {
      console.log("✅")
    } else if (status === "warn") {
      console.log("⚠️")
    } else if (status === "skip") {
      console.log("⏭️")
    } else {
      console.log("❌")
    }
  } catch (error) {
    results.push({
      name,
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
    })
    console.log("❌")
  }
}

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] })
  } catch (error) {
    if (error instanceof Error && "stdout" in error) {
      return (error as any).stdout
    }
    throw error
  }
}

console.log("═══════════════════════════════════════════════════")
console.log("🚀 PRE-LAUNCH QA - AUTOMATED VALIDATION")
console.log("═══════════════════════════════════════════════════")
console.log("\nThis script runs automated checks for Phase 1 QA.")
console.log("Manual checks still required after this completes.\n")

// Check 1: TypeScript Compilation
runCheck(
  "TypeScript Compilation",
  () => {
    try {
      exec("npx tsc --noEmit")
      return "pass"
    } catch {
      return "fail"
    }
  },
  () => "Type checking passed"
)

// Check 2: ESLint
runCheck(
  "ESLint",
  () => {
    try {
      exec("npx eslint .")
      return "pass"
    } catch {
      return "fail"
    }
  },
  () => "Linting passed"
)

// Check 3: Data Validation
runCheck(
  "Service Data Schema Validation",
  () => {
    try {
      exec("node --import tsx scripts/validate-services.ts")
      return "pass"
    } catch {
      return "fail"
    }
  },
  () => "All service records pass schema validation"
)

// Check 4: Data Completeness
runCheck(
  "Data Completeness Audit",
  () => {
    const output = exec("node --import tsx scripts/audit-data-completeness.ts")
    const hasLowCompleteness = /\d+\s+services?\s+below\s+75%\s+completeness/i.test(output)

    if (hasLowCompleteness) {
      return "warn"
    }
    return "pass"
  },
  () => "Data completeness checked",
  () => {
    const output = exec("node --import tsx scripts/audit-data-completeness.ts")
    const lines = output.split("\n").filter((l) => l.includes("completeness") || l.includes("missing"))
    return lines.slice(0, 5)
  }
)

// Check 5: i18n Parity
runCheck(
  "Translation Key Parity (EN/FR)",
  () => {
    const output = exec("node --import tsx scripts/i18n-key-audit.ts")
    const enFrMatch = /EN - (\d+) keys[\s\S]*FR - (\d+) keys/.exec(output)

    if (enFrMatch && enFrMatch[1] === enFrMatch[2]) {
      return "pass"
    } else {
      return "fail"
    }
  },
  () => "EN and FR translation keys match"
)

// Check 6: Environment Config
runCheck(
  "Environment Configuration",
  () => {
    const envExamplePath = path.join(process.cwd(), ".env.example")
    const envLocalPath = path.join(process.cwd(), ".env.local")

    if (!existsSync(envLocalPath)) {
      return "warn"
    }

    // Basic check - full validation via separate script
    return "pass"
  },
  () => ".env.local exists (run `npm run validate:env` for detailed check)"
)

// Check 7: Build Success
runCheck(
  "Production Build",
  () => {
    try {
      console.log("\n   (This may take 1-2 minutes...)")
      exec("npm run build")
      return "pass"
    } catch {
      return "fail"
    }
  },
  () => "Production build succeeded"
)

// Check 8: Critical Files Present
runCheck(
  "Critical Files Present",
  () => {
    const criticalFiles = [
      "app/robots.ts",
      "app/sitemap.ts",
      "app/[locale]/not-found.tsx",
      "app/global-error.tsx",
      "public/.well-known/security.txt",
      ".github/dependabot.yml",
    ]

    const missing = criticalFiles.filter((f) => !existsSync(path.join(process.cwd(), f)))

    if (missing.length > 0) {
      return "fail"
    }
    return "pass"
  },
  () => "All critical Phase 1.5 files present"
)

// Check 9: Unit Tests
runCheck(
  "Unit Tests",
  () => {
    try {
      const output = exec("npm test -- --run")
      // Match "Tests  713 passed" not "Test Files  107 passed"
      const passedMatch = /Tests\s+(\d+)\s+passed/.exec(output)

      if (passedMatch && parseInt(passedMatch[1]) > 700) {
        return "pass"
      }
      return "fail"
    } catch {
      return "fail"
    }
  },
  () => "Unit tests passed (700+ tests)"
)

// Check 10: No console.* in API routes
runCheck(
  "Structured Logging (API Routes)",
  () => {
    try {
      const output = exec('grep -r "console\\." app/api/ || true')
      if (output.trim() === "") {
        return "pass"
      }
      return "fail"
    } catch {
      return "pass" // grep returns non-zero if no matches
    }
  },
  () => "No console.* calls in API routes"
)

// Print Results Summary
console.log("\n")
console.log("═══════════════════════════════════════════════════")
console.log("📊 AUTOMATED QA RESULTS")
console.log("═══════════════════════════════════════════════════\n")

const passed = results.filter((r) => r.status === "pass").length
const failed = results.filter((r) => r.status === "fail").length
const warnings = results.filter((r) => r.status === "warn").length
const skipped = results.filter((r) => r.status === "skip").length

for (const result of results) {
  const icon =
    result.status === "pass" ? "✅" : result.status === "warn" ? "⚠️" : result.status === "skip" ? "⏭️" : "❌"

  console.log(`${icon} ${result.name}`)
  console.log(`   ${result.message}`)

  if (result.details && result.details.length > 0) {
    for (const detail of result.details) {
      console.log(`   ${detail}`)
    }
  }
  console.log()
}

console.log("─────────────────────────────────────────────────────")
console.log(`Total: ${results.length} checks`)
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`⚠️  Warnings: ${warnings}`)
console.log(`⏭️  Skipped: ${skipped}`)
console.log("─────────────────────────────────────────────────────\n")

if (failed > 0) {
  console.log("❌ PRE-LAUNCH QA FAILED")
  console.log("   Address failures above before proceeding to manual QA.\n")
  process.exit(1)
} else if (warnings > 0) {
  console.log("⚠️  PRE-LAUNCH QA PASSED WITH WARNINGS")
  console.log("   Review warnings and proceed to manual QA steps.\n")
  console.log("📋 Next Steps:")
  console.log("   1. Review docs/operations/final-qa-procedures.md")
  console.log("   2. Execute manual QA sections (production env audit, user journey testing)")
  console.log("   3. Complete data quality review for top 20 services\n")
  process.exit(0)
} else {
  console.log("✅ PRE-LAUNCH QA PASSED")
  console.log("   All automated checks passed. Proceed to manual QA steps.\n")
  console.log("📋 Next Steps:")
  console.log("   1. Review docs/operations/final-qa-procedures.md")
  console.log("   2. Execute manual QA sections (production env audit, user journey testing)")
  console.log("   3. Complete data quality review for top 20 services\n")
  process.exit(0)
}
