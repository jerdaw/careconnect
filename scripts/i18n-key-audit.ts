#!/usr/bin/env npx tsx
import { readFileSync, readdirSync, statSync, existsSync } from "fs"
import path from "path"

const MESSAGES_DIR = path.join(process.cwd(), "messages")
const COMPONENTS_DIR = path.join(process.cwd(), "components")
const APP_DIR = path.join(process.cwd(), "app")

function getAllKeys(obj: Record<string, any>, prefix = ""): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null) {
      keys.push(...getAllKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
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

  function scanDir(dir: string) {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir)) {
      const fullPath = path.join(dir, entry)
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

function main() {
  console.log("🌐 Running i18n key audit...\n")

  const enPath = path.join(MESSAGES_DIR, "en.json")
  const frPath = path.join(MESSAGES_DIR, "fr.json")

  if (!existsSync(enPath) || !existsSync(frPath)) {
    console.error("❌ Message files not found in /messages")
    process.exit(1)
  }

  const enMessages = JSON.parse(readFileSync(enPath, "utf-8")) as Record<string, any>
  const frMessages = JSON.parse(readFileSync(frPath, "utf-8")) as Record<string, any>

  const enKeys = new Set(getAllKeys(enMessages))
  const frKeys = new Set(getAllKeys(frMessages))

  const missingInFr = [...enKeys].filter((k) => !frKeys.has(k))
  const missingInEn = [...frKeys].filter((k) => !enKeys.has(k))

  const usedKeys = new Set([...findUsedKeys(COMPONENTS_DIR), ...findUsedKeys(APP_DIR)])

  console.log("📊 Audit Results:\n")

  if (missingInFr.length > 0) {
    console.log(`❌ Missing in French (${missingInFr.length}):`)
    missingInFr.slice(0, 10).forEach((k) => console.log(`   - ${k}`))
    if (missingInFr.length > 10) console.log(`   ... and ${missingInFr.length - 10} more`)
  } else {
    console.log("✅ All English keys have French translations")
  }

  if (missingInEn.length > 0) {
    console.log(`\n❌ Missing in English (${missingInEn.length}):`)
    missingInEn.forEach((k) => console.log(`   - ${k}`))
  }

  console.log(`\n📈 Total keys: EN=${enKeys.size}, FR=${frKeys.size}`)
  console.log(`📈 Used keys found in code: ${usedKeys.size}`)

  // Find unused keys
  const unusedKeys = [...enKeys].filter((k) => !usedKeys.has(k))

  if (unusedKeys.length > 0) {
    console.log(`\n⚠️  Potentially unused keys (${unusedKeys.length}):`)
    unusedKeys.forEach((k) => console.log(`   - ${k}`))
  }

  if (missingInFr.length > 0 || missingInEn.length > 0) {
    process.exit(1)
  }
}

main()
