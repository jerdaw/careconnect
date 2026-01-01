import fs from "fs/promises"
import path from "path"
import { Service } from "../../types/service"

const SEED_FILE = path.join(process.cwd(), "data/seeds/provincial-crisis.json")
const TARGET_FILE = path.join(process.cwd(), "data/services.json")

async function importProvincialCrisis() {
  console.log("🆘 Importing Provincial Crisis Lines...")

  try {
    // Read seed file
    const seedRaw = await fs.readFile(SEED_FILE, "utf-8")
    const crisisLines = JSON.parse(seedRaw) as Service[]

    // Read existing services
    const servicesRaw = await fs.readFile(TARGET_FILE, "utf-8")
    const services = JSON.parse(servicesRaw) as Service[]

    let addedCount = 0
    let skippedCount = 0

    for (const line of crisisLines) {
      // Check for duplicate ID
      if (services.find((s) => s.id === line.id)) {
        console.log(`⚠️  Skipping duplicate ID: ${line.id}`)
        skippedCount++
        continue
      }

      services.push(line)
      addedCount++
      console.log(`✅ Added: ${line.name}`)
    }

    // Write back
    await fs.writeFile(TARGET_FILE, JSON.stringify(services, null, 2))
    console.log(`\n🎉 Import complete! Added: ${addedCount}, Skipped: ${skippedCount}`)

  } catch (error) {
    console.error("❌ Import failed:", error)
  }
}

importProvincialCrisis()
