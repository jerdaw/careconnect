import fs from "fs"
import path from "path"

const locales = ["fr", "zh-Hans", "ar", "pt", "es", "pa"]
const sourcePath = path.join(process.cwd(), "messages/en.json")
const en = JSON.parse(fs.readFileSync(sourcePath, "utf-8"))

function flatten(obj: any, prefix = ""): Record<string, string> {
  const acc: Record<string, string> = {}
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      Object.assign(acc, flatten(obj[key], `${prefix}${key}.`))
    } else {
      acc[`${prefix}${key}`] = obj[key]
    }
  }
  return acc
}

function unflatten(obj: Record<string, string>): any {
  const result: any = {}
  for (const key in obj) {
    const parts = key.split(".")
    let current = result
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        current[part] = obj[key]
      } else {
        current[part] = current[part] || {}
        current = current[part]
      }
    }
  }
  return result
}

const enFlat = flatten(en)

locales.forEach((locale) => {
  const targetPath = path.join(process.cwd(), `messages/${locale}.json`)
  const target = JSON.parse(fs.readFileSync(targetPath, "utf-8"))
  const targetFlat = flatten(target)

  let added = 0
  for (const key in enFlat) {
    if (!targetFlat[key]) {
      targetFlat[key] = enFlat[key] // Copy english value
      added++
    }
  }

  if (added > 0) {
    const newTarget = unflatten(targetFlat)
    fs.writeFileSync(targetPath, JSON.stringify(newTarget, null, 2))
    console.log(`Patched ${locale} with ${added} missing keys`)
  } else {
    console.log(`${locale} is up to date`)
  }
})
