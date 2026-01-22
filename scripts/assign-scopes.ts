#!/usr/bin/env tsx
/**
 * Scope Assignment Script
 *
 * Assigns geographic scope to services based on:
 * - Service type (crisis lines, telehealth → provincial/national)
 * - Address location (Kingston addresses → kingston)
 * - Service name patterns (national services → canada)
 *
 * Usage: npx tsx scripts/assign-scopes.ts
 */

import fs from "fs/promises"
import path from "path"

interface Service {
  id: string
  name: string
  intent_category: string
  address?: string
  phone?: string
  scope?: "kingston" | "ontario" | "canada"
  is_provincial?: boolean
  virtual_delivery?: boolean
}

// National services (available across Canada)
const NATIONAL_SERVICES = [
  "kids-help-phone",
  "talk-suicide-canada",
  "crisis-text-line",
  "trans-lifeline-canada",
  "trans-lifeline",
  "hope-for-wellness-helpline",
  "assaulted-womens-helpline",
  "kids help phone",
  "crisis text line",
  "trans lifeline",
  "hope for wellness",
]

// Provincial services (Ontario-wide)
const PROVINCIAL_SERVICES = [
  "211-ontario",
  "telehealth-ontario",
  "connex-ontario",
  "ontario-poison-centre",
  "988-suicide-crisis",
  "good2talk",
  "distress-centre-ontario",
  "ontario crisis",
  "telehealth",
  "211 ontario",
  "connex ontario",
]

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

async function saveServices(services: Service[]): Promise<void> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  await fs.writeFile(servicesPath, JSON.stringify(services, null, 2) + "\n", "utf-8")
}

function assignScope(service: Service): "kingston" | "ontario" | "canada" {
  // Already has scope - keep it unless it's from legacy is_provincial
  if (service.scope && !service.is_provincial) {
    return service.scope
  }

  const nameLower = service.name.toLowerCase()
  const idLower = service.id.toLowerCase()

  // Check for national services
  if (NATIONAL_SERVICES.some((pattern) => idLower.includes(pattern) || nameLower.includes(pattern))) {
    return "canada"
  }

  // Check for provincial services
  if (PROVINCIAL_SERVICES.some((pattern) => idLower.includes(pattern) || nameLower.includes(pattern))) {
    return "ontario"
  }

  // Legacy is_provincial flag
  if (service.is_provincial) {
    return "ontario"
  }

  // Crisis and telehealth services are typically provincial
  if (service.intent_category === "Crisis" && service.virtual_delivery) {
    return "ontario"
  }

  // Services with Kingston addresses
  if (service.address) {
    const addressLower = service.address.toLowerCase()
    if (
      addressLower.includes("kingston") ||
      addressLower.includes("frontenac") ||
      addressLower.includes("k7k") ||
      addressLower.includes("k7l") ||
      addressLower.includes("k7m") ||
      addressLower.includes("k7p")
    ) {
      return "kingston"
    }
  }

  // Virtual/phone-only services without specific location
  if (service.virtual_delivery && !service.address) {
    return "ontario"
  }

  // Default to Kingston for services with phone but no clear provincial indicators
  return "kingston"
}

async function main() {
  console.log("🗺️  Scope Assignment")
  console.log("═".repeat(60))
  console.log("")

  const services = await loadServices()

  let assigned = 0
  let updated = 0
  let unchanged = 0

  const scopeCounts = {
    kingston: 0,
    ontario: 0,
    canada: 0,
  }

  services.forEach((service) => {
    const oldScope = service.scope
    const newScope = assignScope(service)

    service.scope = newScope
    scopeCounts[newScope]++

    if (!oldScope) {
      assigned++
    } else if (oldScope !== newScope) {
      updated++
      console.log(`  📝 Updated: ${service.name}`)
      console.log(`     ${oldScope} → ${newScope}`)
    } else {
      unchanged++
    }
  })

  await saveServices(services)

  console.log("")
  console.log("📊 Results:")
  console.log(`  New assignments: ${assigned}`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Unchanged: ${unchanged}`)
  console.log("")
  console.log("🗺️  Scope Distribution:")
  console.log(`  Kingston: ${scopeCounts.kingston}`)
  console.log(`  Ontario: ${scopeCounts.ontario}`)
  console.log(`  Canada: ${scopeCounts.canada}`)
  console.log("")
  console.log("═".repeat(60))
  console.log("✅ Scope assignment complete")
  console.log("")
  console.log("📌 Next Steps:")
  console.log("  1. Spot-check 20 random services")
  console.log("  2. Review any updated scopes above")
  console.log("  3. Run: npm run validate-data")
}

main().catch((error) => {
  console.error("Error assigning scopes:", error)
  process.exit(1)
})
