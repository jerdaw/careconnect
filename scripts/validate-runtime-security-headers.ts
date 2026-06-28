#!/usr/bin/env tsx

import { DEFAULT_RUNTIME_SECURITY_HEADER_PATHS, validateRuntimeSecurityHeaders } from "@/lib/security/security-headers"

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
}

function parsePaths(input?: string): string[] {
  if (!input) {
    return [...DEFAULT_RUNTIME_SECURITY_HEADER_PATHS]
  }

  return input
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean)
}

async function main() {
  const baseUrl = process.env.SECURITY_HEADERS_BASE_URL || "http://127.0.0.1:3000"
  const paths = parsePaths(process.env.SECURITY_HEADERS_PATHS)

  console.log(`${colors.blue}${colors.bold}🔒 Runtime Security Headers Validation${colors.reset}\n`)
  console.log(`Base URL: ${baseUrl}`)
  console.log(`Paths: ${paths.join(", ")}\n`)

  const result = await validateRuntimeSecurityHeaders({ baseUrl, paths })
  let warningCount = 0

  for (const pathResult of result.results) {
    const label = `${pathResult.path} (${pathResult.url})`

    if (pathResult.error) {
      console.log(`${colors.red}✗ ${label}${colors.reset}`)
      console.log(`  ${colors.red}${pathResult.error}${colors.reset}\n`)
      continue
    }

    console.log(
      pathResult.passed ? `${colors.green}✓ ${label}${colors.reset}` : `${colors.red}✗ ${label}${colors.reset}`
    )
    console.log(`  Status: ${pathResult.status}`)

    for (const check of pathResult.report?.checks || []) {
      if (check.result.passed) {
        console.log(`  ${colors.green}✓${colors.reset} ${check.headerName}`)
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${check.headerName}`)
      }

      if (!check.present) {
        console.log(`    ${colors.red}Missing required header${colors.reset}`)
        continue
      }

      for (const issue of check.result.issues) {
        console.log(`    ${colors.red}${issue}${colors.reset}`)
      }

      for (const warning of check.result.warnings) {
        warningCount++
        console.log(`    ${colors.yellow}⚠ ${warning}${colors.reset}`)
      }
    }

    console.log()
  }

  const fetchFailureCount = result.results.filter((pathResult) => pathResult.error).length
  const allFetchesFailed = fetchFailureCount === result.results.length
  const partialFetchFailure = fetchFailureCount > 0 && !allFetchesFailed

  console.log(`${colors.bold}Summary:${colors.reset}`)
  if (result.passed) {
    console.log(`${colors.green}All checked runtime responses exposed the required security headers${colors.reset}`)
  } else if (allFetchesFailed) {
    console.log(`${colors.red}Runtime target unreachable; no security headers could be checked${colors.reset}`)
  } else if (partialFetchFailure) {
    console.log(
      `${colors.red}Some runtime responses were unreachable or exposed misconfigured security headers${colors.reset}`
    )
  } else {
    console.log(
      `${colors.red}One or more runtime responses are missing or misconfiguring security headers${colors.reset}`
    )
  }

  if (warningCount > 0) {
    console.log(`${colors.yellow}${warningCount} warning(s) - review recommended${colors.reset}`)
  }

  process.exit(result.passed ? 0 : 1)
}

void main()
