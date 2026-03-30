#!/usr/bin/env npx tsx
/**
 * Multi-lingual i18n Audit Script
 *
 * Checks that all supported languages have the required translation keys.
 * English (en) is treated as the source of truth.
 *
 * Usage: npm run i18n-audit
 */
import { existsSync, readFileSync } from "fs"
import path from "path"
import { pathToFileURL } from "url"
import {
  DUPLICATE_ENGLISH_ALLOWLIST,
  LOCALES,
  SOURCE_LOCALE,
  findDuplicateEnglishKeys,
  findUsedKeysInFiles,
  getAllKeys,
  isOptionalForEDIA,
  readTranslationFilesFromDir,
} from "@/lib/i18n/audit"

const MESSAGES_DIR = path.join(process.cwd(), "messages")
const COMPONENTS_DIR = path.join(process.cwd(), "components")
const APP_DIR = path.join(process.cwd(), "app")
const LIB_DIR = path.join(process.cwd(), "lib")
const DUPLICATE_ENGLISH_ENFORCED_PREFIXES = [
  "Admin.notifications",
  "Admin.observability",
  "Analytics.dashboard",
  "Dashboard.notifications",
  "Dashboard.overview",
  "Dashboard.services.viewPage.toast",
  "Feedback",
  "Impact",
] as const

interface AuditResult {
  duplicateEnglishKeys: string[]
  locale: string
  totalKeys: number
  missingKeys: string[]
  extraKeys: string[]
}

function loadMessages(locale: string): Record<string, unknown> | null {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`)
  if (!existsSync(filePath)) {
    return null
  }
  return JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>
}

export function main() {
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

  const usedKeys = findUsedKeysInFiles([
    ...readTranslationFilesFromDir(COMPONENTS_DIR),
    ...readTranslationFilesFromDir(APP_DIR),
    ...readTranslationFilesFromDir(LIB_DIR),
  ])
  const enforcedUsedKeys = [...usedKeys].filter((key) =>
    DUPLICATE_ENGLISH_ENFORCED_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix}.`))
  )

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
    const duplicateEnglishKeys =
      locale === SOURCE_LOCALE
        ? []
        : findDuplicateEnglishKeys(sourceMessages, messages, enforcedUsedKeys, DUPLICATE_ENGLISH_ALLOWLIST)

    results.push({
      duplicateEnglishKeys,
      locale,
      totalKeys: localeKeys.size,
      missingKeys,
      extraKeys,
    })

    if (missingKeys.length > 0) {
      if (["en", "fr"].includes(locale)) {
        hasErrors = true
      }
    }

    if (duplicateEnglishKeys.length > 0) {
      hasErrors = true
    }
  }

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

    if (result.duplicateEnglishKeys.length > 0) {
      console.log(`   ❌ Exact English duplicates on used keys (${result.duplicateEnglishKeys.length}):`)
      result.duplicateEnglishKeys.slice(0, 5).forEach((k) => console.log(`     - ${k}`))
      if (result.duplicateEnglishKeys.length > 5) {
        console.log(`     ... and ${result.duplicateEnglishKeys.length - 5} more`)
      }
    }

    console.log()
  }

  // Summary table
  console.log("───────────────────────────────────────────────────────────────")
  console.log("📈 SUMMARY")
  console.log("───────────────────────────────────────────────────────────────")
  console.log(`\n   Locale    | Keys  | Missing | Extra | Dup EN`)
  console.log(`   ----------|-------|---------|-------|-------`)
  for (const result of results) {
    console.log(
      `   ${result.locale.padEnd(10)}| ${String(result.totalKeys).padEnd(5)} | ${String(result.missingKeys.length).padEnd(7)} | ${String(result.extraKeys.length).padEnd(5)} | ${result.duplicateEnglishKeys.length}`
    )
  }
  console.log(`\n   Used in code: ${usedKeys.size} unique keys`)
  console.log(`   Duplicate-English enforcement: ${enforcedUsedKeys.length} keys in focused namespaces`)

  // Find unused keys
  const unusedKeys = [...sourceKeys].filter((k) => !usedKeys.has(k))
  if (unusedKeys.length > 0) {
    console.log(`   ⚠️  Potentially unused: ${unusedKeys.length} keys`)
  }

  console.log("\n═══════════════════════════════════════════════════════════════\n")

  if (hasErrors) {
    console.log("❌ Audit failed - missing keys or exact-English duplicates detected\n")
    process.exit(1)
  } else {
    console.log("✅ All locales have required keys\n")
  }
}

const isDirectRun =
  process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isDirectRun) {
  main()
}
