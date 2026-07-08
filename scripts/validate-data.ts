import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { ZodError } from "zod"
import { ServicesArraySchema } from "../lib/schemas/service"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function validateData() {
  const dataPath = path.join(__dirname, "../data/services.json")

  try {
    const rawData = fs.readFileSync(dataPath, "utf-8")
    const json = JSON.parse(rawData) as unknown
    const recordCount = Array.isArray(json) ? json.length : 0

    console.log(`Validating ${recordCount} records in services.json...`)

    const result = ServicesArraySchema.safeParse(json)

    if (!result.success) {
      console.error("Validation failed.")
      result.error.issues.forEach((issue) => {
        console.error(`   - Path: [${issue.path.join(" -> ")}] | Message: ${issue.message}`)
      })
      process.exit(1)
    }

    console.log("Validation passed. All records meet the CareConnect service schema.")
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation failed.", error.issues)
    } else {
      console.error("Error reading or parsing file:", error)
    }
    process.exit(1)
  }
}

validateData()
