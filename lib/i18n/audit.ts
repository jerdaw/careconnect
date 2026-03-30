import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

export const LOCALES = ["en", "fr", "zh-Hans", "ar", "pt", "es", "pa"] as const
export const SOURCE_LOCALE = "en"

export const OPTIONAL_KEYS_FOR_EDIA = [
  /^Terms\.sections\./,
  /^Privacy\.sections\./,
  /^AccessibilityPolicy\.(?!title|lastUpdated)/,
  /^PartnerTerms\.sections\./,
  /^ContentPolicy\.sections\./,
]

export const DUPLICATE_ENGLISH_ALLOWLIST = new Set<string>([
  "ServiceDetail.kingston",
  "Admin.observability.performance.metrics.p50",
  "Admin.observability.performance.metrics.p95",
  "Admin.observability.performance.metrics.p99",
  "Admin.observability.slo.latency.noDataSymbol",
])

export interface TranslationFile {
  content: string
  path: string
}

export function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
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

export function getMessageValue(messages: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined
    }

    return (current as Record<string, unknown>)[segment]
  }, messages)
}

export function isOptionalForEDIA(key: string): boolean {
  return OPTIONAL_KEYS_FOR_EDIA.some((pattern) => pattern.test(key))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function extractTranslationBindings(content: string): Map<string, string> {
  const bindings = new Map<string, string>()
  const bindingPattern =
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:\{[\s\S]*?\bnamespace\s*:\s*["'`]([^"'`]+)["'`][\s\S]*?\}|["'`]([^"'`]+)["'`])?\s*\)/g

  for (const match of content.matchAll(bindingPattern)) {
    const variableName = match[1]
    const namespace = match[2] ?? match[3] ?? ""

    if (variableName) {
      bindings.set(variableName, namespace)
    }
  }

  return bindings
}

function extractStaticCalls(content: string, variableName: string): string[] {
  const calls: string[] = []
  const callPattern = new RegExp(`\\b${escapeRegExp(variableName)}\\s*\\(\\s*(["'\`])([^"'\\\`$]+)\\1`, "g")

  for (const match of content.matchAll(callPattern)) {
    const key = match[2]?.trim()

    if (key) {
      calls.push(key)
    }
  }

  return calls
}

export function findUsedKeysInContent(content: string): Set<string> {
  const usedKeys = new Set<string>()
  const bindings = extractTranslationBindings(content)

  for (const [variableName, namespace] of bindings.entries()) {
    for (const key of extractStaticCalls(content, variableName)) {
      usedKeys.add(namespace ? `${namespace}.${key}` : key)
    }
  }

  return usedKeys
}

export function findUsedKeysInFiles(files: TranslationFile[]): Set<string> {
  const usedKeys = new Set<string>()

  for (const file of files) {
    for (const key of findUsedKeysInContent(file.content)) {
      usedKeys.add(key)
    }
  }

  return usedKeys
}

export function readTranslationFilesFromDir(dir: string): TranslationFile[] {
  const files: TranslationFile[] = []

  function scanDirectory(currentDir: string) {
    if (!existsSync(currentDir)) {
      return
    }

    for (const entry of readdirSync(currentDir)) {
      const fullPath = path.join(currentDir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules") {
        scanDirectory(fullPath)
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        files.push({
          path: fullPath,
          content: readFileSync(fullPath, "utf-8"),
        })
      }
    }
  }

  scanDirectory(dir)
  return files
}

export function findDuplicateEnglishKeys(
  sourceMessages: Record<string, unknown>,
  localeMessages: Record<string, unknown>,
  usedKeys: Iterable<string>,
  allowlist = DUPLICATE_ENGLISH_ALLOWLIST
): string[] {
  const duplicates: string[] = []

  for (const key of usedKeys) {
    if (allowlist.has(key)) {
      continue
    }

    const sourceValue = getMessageValue(sourceMessages, key)
    const localeValue = getMessageValue(localeMessages, key)

    if (typeof sourceValue === "string" && localeValue === sourceValue) {
      duplicates.push(key)
    }
  }

  return duplicates.sort()
}
