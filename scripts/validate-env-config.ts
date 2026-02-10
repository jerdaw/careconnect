#!/usr/bin/env npx tsx
/**
 * Environment Configuration Validator
 *
 * Validates that .env.example is comprehensive and checks for placeholder values.
 * Run this before production deployment to ensure all env vars are documented.
 */

import { readFileSync, existsSync } from "fs"
import path from "path"

const ENV_EXAMPLE_PATH = path.join(process.cwd(), ".env.example")
const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local")

interface EnvVar {
  name: string
  value: string
  isPlaceholder: boolean
  isOptional: boolean
}

const PLACEHOLDER_PATTERNS = [
  /your[-_]?/i,
  /example/i,
  /placeholder/i,
  /changeme/i,
  /secret[-_]?key[-_]?here/i,
  /\[.*\]/, // [value] format
  /<.*>/, // <value> format
]

const OPTIONAL_VARS = [
  // Phone validation (dev/testing only)
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  // Push notifications (optional feature)
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "ONESIGNAL_APP_ID",
  "ONESIGNAL_REST_API_KEY",
  // Geocoding (optional enrichment)
  "OPENCAGE_API_KEY",
  // AI features (optional)
  "OPENAI_API_KEY",
  // Mobile infrastructure (optional)
  "NEXT_PUBLIC_MOBILE_INFRASTRUCTURE",
  // Performance tracking (optional, defaults to false)
  "NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING",
  // Circuit breaker (has defaults)
  "CIRCUIT_BREAKER_ENABLED",
  "CIRCUIT_BREAKER_FAILURE_THRESHOLD",
  "CIRCUIT_BREAKER_TIMEOUT",
  // Observability (optional for dev, required for production)
  "AXIOM_TOKEN",
  "AXIOM_ORG_ID",
  "AXIOM_DATASET",
  "SLACK_WEBHOOK_URL",
  // Vercel cron (production only)
  "CRON_SECRET",
]

function parseEnvFile(filePath: string): Map<string, string> {
  if (!existsSync(filePath)) {
    return new Map()
  }

  const content = readFileSync(filePath, "utf-8")
  const vars = new Map<string, string>()

  for (const line of content.split("\n")) {
    const trimmed = line.trim()

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) continue

    // Parse KEY=VALUE
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match) {
      const [, key, value] = match
      vars.set(key, value)
    }
  }

  return vars
}

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))
}

function analyzeEnvVars(
  envExample: Map<string, string>,
  envLocal: Map<string, string>
): {
  exampleVars: EnvVar[]
  missingInLocal: string[]
  placeholdersInLocal: string[]
} {
  const exampleVars: EnvVar[] = []
  const missingInLocal: string[] = []
  const placeholdersInLocal: string[] = []

  for (const [name, exampleValue] of envExample) {
    const isOptional = OPTIONAL_VARS.includes(name)
    const localValue = envLocal.get(name)

    exampleVars.push({
      name,
      value: exampleValue,
      isPlaceholder: isPlaceholder(exampleValue),
      isOptional,
    })

    // Check if missing in local
    if (!localValue && !isOptional) {
      missingInLocal.push(name)
    }

    // Check if local still has placeholder value
    if (localValue && isPlaceholder(localValue)) {
      placeholdersInLocal.push(name)
    }
  }

  return { exampleVars, missingInLocal, placeholdersInLocal }
}

function main() {
  console.log("🔍 Environment Configuration Validator\n")

  // Parse files
  const envExample = parseEnvFile(ENV_EXAMPLE_PATH)
  const envLocal = parseEnvFile(ENV_LOCAL_PATH)

  console.log(`📋 Found ${envExample.size} variables in .env.example`)
  console.log(`📋 Found ${envLocal.size} variables in .env.local\n`)

  // Analyze
  const { exampleVars, missingInLocal, placeholdersInLocal } = analyzeEnvVars(envExample, envLocal)

  // Report: Required variables
  const requiredVars = exampleVars.filter((v) => !v.isOptional)
  console.log(`✅ Required Variables (${requiredVars.length}):`)
  for (const v of requiredVars) {
    const status = envLocal.has(v.name) ? "✓" : "✗"
    console.log(`   ${status} ${v.name}`)
  }
  console.log()

  // Report: Optional variables
  const optionalVars = exampleVars.filter((v) => v.isOptional)
  console.log(`⚙️  Optional Variables (${optionalVars.length}):`)
  for (const v of optionalVars) {
    const status = envLocal.has(v.name) ? "✓" : "○"
    console.log(`   ${status} ${v.name}`)
  }
  console.log()

  // Report: Issues
  let hasIssues = false

  if (missingInLocal.length > 0) {
    hasIssues = true
    console.log(`❌ Missing Required Variables in .env.local (${missingInLocal.length}):`)
    for (const name of missingInLocal) {
      console.log(`   - ${name}`)
    }
    console.log()
  }

  if (placeholdersInLocal.length > 0) {
    hasIssues = true
    console.log(`⚠️  Placeholder Values Detected in .env.local (${placeholdersInLocal.length}):`)
    for (const name of placeholdersInLocal) {
      console.log(`   - ${name}: ${envLocal.get(name)}`)
    }
    console.log()
  }

  // Report: Production checklist
  console.log("─────────────────────────────────────────")
  console.log("📝 PRODUCTION DEPLOYMENT CHECKLIST")
  console.log("─────────────────────────────────────────")
  console.log()
  console.log("Before deploying to production, verify:")
  console.log()
  console.log("1. All required environment variables are set in Vercel/hosting platform")
  console.log("2. No placeholder values remain (check for 'example', 'your-', etc.)")
  console.log("3. Sensitive keys (SUPABASE_SECRET_KEY, SLACK_WEBHOOK_URL) are kept secure")
  console.log("4. NEXT_PUBLIC_SEARCH_MODE is set appropriately ('local' or 'server')")
  console.log("5. Observability variables (AXIOM_*, SLACK_*) are configured if using v18.0 monitoring")
  console.log()

  // Exit code
  if (hasIssues) {
    console.log("❌ Validation failed. Address issues above before production deployment.")
    process.exit(1)
  } else {
    console.log("✅ Environment configuration looks good!")
    console.log("   (Still verify production values in your hosting dashboard)")
    process.exit(0)
  }
}

main()
