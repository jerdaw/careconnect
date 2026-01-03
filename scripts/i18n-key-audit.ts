#!/usr/bin/env npx tsx
/**
 * Multi-lingual i18n Audit Script
 *
 * Checks that all supported languages have the required translation keys.
 * English (en) is treated as the source of truth.
 *
 * Usage: npm run i18n-audit
 */
import { readFileSync, readdirSync, statSync, existsSync } from "fs"
import path from "path"

const MESSAGES_DIR = path.join(process.cwd(), "messages")
const COMPONENTS_DIR = path.join(process.cwd(), "components")
const APP_DIR = path.join(process.cwd(), "app")

// All supported locales - English is the source of truth
const LOCALES = ["en", "fr", "ar", "zh-Hans", "es"] as const
const SOURCE_LOCALE = "en"

// Keys that are allowed to be missing in non-official languages (ar, zh-Hans, es)
// These are typically full legal content that may only be available in EN/FR
const OPTIONAL_KEYS_FOR_EDIA = [
  /^Terms\.sections\./,
  /^Privacy\.sections\./,
  /^AccessibilityPolicy\.(?!title|lastUpdated)/,
  /^PartnerTerms\.sections\./,
  /^ContentPolicy\.sections\./,
]

interface AuditResult {
  locale: string
  totalKeys: number
  missingKeys: string[]
  extraKeys: string[]
}

function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

function isOptionalForEDIA(key: string): boolean {
  return OPTIONAL_KEYS_FOR_EDIA.some((pattern) => pattern.test(key))
}

function findUsedKeys(dir: string): Set<string> {
  const usedKeys = new Set<string>()
  const tPattern = /t\(["'`]([^"'`]+)["'`]\)/g

  function scanFile(filePath: string) {
    const content = readFileSync(filePath, "utf-8")
    let match: RegExpExecArray | null
    while ((match = tPattern.exec(content)) !== null) {
      if (match[1]) usedKeys.add(match[1])
    }
  }

  function scanDir(currentDir: string) {
    if (!existsSync(currentDir)) return
    for (const entry of readdirSync(currentDir)) {
      const fullPath = path.join(currentDir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules") {
        scanDir(fullPath)
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        scanFile(fullPath)
      }
    }
  }

  scanDir(dir)
  return usedKeys
}

function loadMessages(locale: string): Record<string, unknown> | null {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`)
  if (!existsSync(filePath)) {
    return null
  }
  return JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>
}

function main() {
  console.log("🌐 Running Multi-lingual i18n Audit...\n")
  console.log(`📋 Supported locales: ${LOCALES.join(", ")}`)
  console.log(`📋 Source of truth: ${SOURCE_LOCALE}\n`)

  // Load source messages
  const sourceMessages = loadMessages(SOURCE_LOCALE)
  if (!sourceMessages) {
    console.error(`❌ Source locale (${SOURCE_LOCALE}) not found in /messages`)
    process.exit(1)
  }

  const sourceKeys = new Set(getAllKeys(sourceMessages))

  // Audit each locale
  const results: AuditResult[] = []
  let hasErrors = false

  for (const locale of LOCALES) {
    const messages = loadMessages(locale)
    if (!messages) {
      console.error(`❌ Locale ${locale} not found in /messages`)
      hasErrors = true
      continue
    }

    const localeKeys = new Set(getAllKeys(messages))
    const isEDIALocale = !["en", "fr"].includes(locale)

    // Find missing keys
    const missingKeys = [...sourceKeys].filter((key) => {
      if (localeKeys.has(key)) return false
      // For EDIA locales, some keys are optional
      if (isEDIALocale && isOptionalForEDIA(key)) return false
      return true
    })

    // Find extra keys (in locale but not in source)
    const extraKeys = [...localeKeys].filter((key) => !sourceKeys.has(key))

    results.push({
      locale,
      totalKeys: localeKeys.size,
      missingKeys,
      extraKeys,
    })

    if (missingKeys.length > 0) hasErrors = true
  }

  // Find used keys in code
  const usedKeys = new Set([...findUsedKeys(COMPONENTS_DIR), ...findUsedKeys(APP_DIR)])

  // Print results
  console.log("═══════════════════════════════════════════════════════════════")
  console.log("📊 AUDIT RESULTS")
  console.log("═══════════════════════════════════════════════════════════════\n")

  for (const result of results) {
    const isSource = result.locale === SOURCE_LOCALE
    const icon = result.missingKeys.length === 0 ? "✅" : "❌"

    console.log(`${icon} ${result.locale.toUpperCase()} - ${result.totalKeys} keys`)

    if (result.missingKeys.length > 0) {
      console.log(`   Missing (${result.missingKeys.length}):`)
      result.missingKeys.slice(0, 5).forEach((k) => console.log(`     - ${k}`))
      if (result.missingKeys.length > 5) {
        console.log(`     ... and ${result.missingKeys.length - 5} more`)
      }
    }

    if (result.extraKeys.length > 0 && !isSource) {
      console.log(`   ⚠️  Extra keys not in source (${result.extraKeys.length}):`)
      result.extraKeys.slice(0, 3).forEach((k) => console.log(`     - ${k}`))
      if (result.extraKeys.length > 3) {
        console.log(`     ... and ${result.extraKeys.length - 3} more`)
      }
    }

    console.log()
  }

  // Summary table
  console.log("───────────────────────────────────────────────────────────────")
  console.log("📈 SUMMARY")
  console.log("───────────────────────────────────────────────────────────────")
  console.log(`\n   Locale    | Keys  | Missing | Extra`)
  console.log(`   ----------|-------|---------|-------`)
  for (const result of results) {
    console.log(
      `   ${result.locale.padEnd(10)}| ${String(result.totalKeys).padEnd(5)} | ${String(result.missingKeys.length).padEnd(7)} | ${result.extraKeys.length}`
    )
  }
  console.log(`\n   Used in code: ${usedKeys.size} unique keys`)

  // Find unused keys
  const unusedKeys = [...sourceKeys].filter((k) => !usedKeys.has(k))
  if (unusedKeys.length > 0) {
    console.log(`   ⚠️  Potentially unused: ${unusedKeys.length} keys`)
  }

  console.log("\n═══════════════════════════════════════════════════════════════\n")

  if (hasErrors) {
    console.log("❌ Audit failed - missing keys detected\n")
    process.exit(1)
  } else {
    console.log("✅ All locales have required keys\n")
  }
}

main()
