import fs from "fs/promises"
import path from "path"
import { Service, VerificationLevel, IntentCategory } from "../../types/service"

const TARGET_FILE = path.join(process.cwd(), "data/services.json")

interface GeoJSONFeature {
  properties: {
    id: string
    name: string
    description: string
    website?: string
    phone?: string
    address?: string
    category: string
    tags?: string[]
    hours_notes?: string
  }
  geometry: {
    coordinates: [number, number]
  }
}

interface GeoJSONData {
  features: GeoJSONFeature[]
}

// Parse args
const args = process.argv.slice(2)
const fileArgIndex = args.indexOf("--file")
const fileArg = args[fileArgIndex + 1]

if (fileArgIndex === -1 || !fileArg) {
  console.error("❌ Error: Please specify a seed file with --file <path>")
  process.exit(1)
}

const SEED_FILE = path.resolve(process.cwd(), fileArg)

async function importData() {
  console.log(`📦 Importing from ${path.basename(SEED_FILE)}...`)

  try {
    // Read seed file
    const seedRaw = await fs.readFile(SEED_FILE, "utf-8")
    const seedData = JSON.parse(seedRaw) as GeoJSONData

    // Read existing services
    const servicesRaw = await fs.readFile(TARGET_FILE, "utf-8")
    const services = JSON.parse(servicesRaw) as Service[]

    let addedCount = 0
    let skippedCount = 0

    for (const feature of seedData.features) {
      const props = feature.properties
      
      // Check for duplicate ID
      if (services.find((s) => s.id === props.id)) {
        console.log(`⚠️  Skipping duplicate ID: ${props.id}`)
        skippedCount++
        continue
      }

      const newService: Service = {
        id: props.id,
        name: props.name,
        description: props.description,
        url: props.website || "",
        phone: props.phone,
        address: props.address,
        verification_level: VerificationLevel.L1,
        intent_category: props.category as IntentCategory,
        provenance: {
          verified_by: "Antigravity (Manual GeoJSON Import)",
          verified_at: new Date().toISOString(),
          evidence_url: props.website || "https://211ontario.ca",
          method: "Manual Curation & Import"
        },
        identity_tags: (props.tags || []).map((tag: string) => ({
          tag: tag,
          evidence_url: props.website || ""
        })),
        synthetic_queries: [
          `${props.name} help`,
          `${props.category} kingston`,
          props.address ? `Services at ${props.address}` : `${props.name} location`
        ],
        eligibility_notes: "Open to eligible Kingston residents. See website for details.",
        coordinates: {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0]
        },
        hours: {
           notes: props.hours_notes
        }
      }

      services.push(newService)
      addedCount++
      console.log(`✅ Added: ${newService.name}`)
    }

    // Write back
    await fs.writeFile(TARGET_FILE, JSON.stringify(services, null, 2))
    console.log(`\n🎉 Import complete! Added: ${addedCount}, Skipped: ${skippedCount}`)

  } catch (error) {
    console.error("❌ Import failed:", error)
  }
}

importData()
