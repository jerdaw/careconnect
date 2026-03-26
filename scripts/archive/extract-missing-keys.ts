import { readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"

const MESSAGES_DIR = path.join(process.cwd(), "messages")
const LOCALES = ["zh-Hans", "ar", "pt", "es", "pa"]
const SOURCE_LOCALE = "en"

const OPTIONAL_KEYS_FOR_EDIA = [
  /^Terms\.sections\./,
  /^Privacy\.sections\./,
  /^AccessibilityPolicy\.(?!title|lastUpdated)/,
  /^PartnerTerms\.sections\./,
  /^ContentPolicy\.sections\./,
]

function getAllKeys(obj: any, prefix = ""): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

function isOptionalForEDIA(key: string): boolean {
  return OPTIONAL_KEYS_FOR_EDIA.some((pattern) => pattern.test(key))
}

function loadMessages(locale: string) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`)
  if (!existsSync(filePath)) return null
  return JSON.parse(readFileSync(filePath, "utf-8"))
}

function main() {
  const sourceMessages = loadMessages(SOURCE_LOCALE)
  const sourceKeys = getAllKeys(sourceMessages)
  const missingByLocale: any = {}

  for (const locale of LOCALES) {
    const messages = loadMessages(locale)
    const localeKeys = new Set(getAllKeys(messages))

    missingByLocale[locale] = sourceKeys.filter((key) => {
      if (localeKeys.has(key)) return false
      if (isOptionalForEDIA(key)) return false
      return true
    })
  }

  writeFileSync("missing_keys.json", JSON.stringify(missingByLocale, null, 2))
  console.log("Missing keys wrote to missing_keys.json")
}

main()
