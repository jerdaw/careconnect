/**
 * Enrichment script to auto-classify authority_tier for services.
 *
 * Usage:
 *   npx tsx scripts/enrich-authority-tiers.ts [--dry-run]
 *
 * Outputs:
 *   - data/services.json (updated)
 *   - supabase/migrations/20260113200000_enrich_authority_tiers.sql
 */

import fs from "fs"
import path from "path"
import { Service, AuthorityTier } from "@/types/service"
import rawServices from "../data/services.json"

// Ensure we're working with the correct type
const services = rawServices as unknown as Service[]

interface ClassificationResult {
  id: string
  name: string
  url: string
  currentTier: AuthorityTier | undefined
  suggestedTier: AuthorityTier
  reason: string
  confidence: "high" | "medium" | "low"
}

function classifyService(service: Service): {
  tier: AuthorityTier
  reason: string
  confidence: "high" | "medium" | "low"
} {
  const url = service.url?.toLowerCase() || ""
  const name = service.name.toLowerCase()

  // Government detection (high confidence)
  if (
    url.includes(".gc.ca") ||
    url.includes(".gov.on.ca") ||
    url.includes(".canada.ca") ||
    url.includes("ontario.ca") ||
    url.includes("cityofkingston.ca")
  ) {
    return {
      tier: "government",
      reason: "Government domain detected",
      confidence: "high",
    }
  }

  // Healthcare detection (high confidence)
  if (
    url.includes("kingstonhsc") ||
    url.includes("hospital") ||
    name.includes("hospital") ||
    name.includes("health centre") ||
    name.includes("health center") ||
    (service.intent_category === "Health" && service.verification_level === "L3")
  ) {
    return {
      tier: "healthcare",
      reason: "Healthcare organization detected",
      confidence: "high",
    }
  }

  // Known established nonprofits (medium confidence - manual list)
  const establishedNonprofits = [
    "kids-help-phone",
    "united-way",
    "salvation-army",
    "red-cross",
    "cmha",
    "canadian-mental-health",
    "hope-for-wellness",
    "trans-lifeline",
    "assaulted-womens-helpline",
    "victim-services",
    "partners-in-mission",
  ]
  if (establishedNonprofits.some((id) => service.id.includes(id))) {
    return {
      tier: "established_nonprofit",
      reason: "Known national/provincial nonprofit",
      confidence: "medium",
    }
  }

  // High verification = established (medium confidence)
  if (service.verification_level === "L3" || service.verification_level === "L2") {
    if (service.address || service.scope === "canada" || service.scope === "ontario") {
      return {
        tier: "established_nonprofit",
        reason: "High verification level with physical presence",
        confidence: "medium",
      }
    }
  }

  // Default (low confidence - needs review)
  return {
    tier: "community",
    reason: "Default community classification",
    confidence: "low",
  }
}

// Main execution
function main() {
  console.log(`Analyzing ${services.length} services...`)

  const results: ClassificationResult[] = services.map((service) => {
    const { tier, reason, confidence } = classifyService(service)
    return {
      id: service.id,
      name: service.name,
      url: service.url,
      currentTier: service.authority_tier,
      suggestedTier: tier,
      reason,
      confidence,
    }
  })

  // Analysis Report
  console.log(`\nClassification Results:`)
  console.log(`Government: ${results.filter((r) => r.suggestedTier === "government").length}`)
  console.log(`Healthcare: ${results.filter((r) => r.suggestedTier === "healthcare").length}`)
  console.log(`Established Nonprofit: ${results.filter((r) => r.suggestedTier === "established_nonprofit").length}`)
  console.log(`Community: ${results.filter((r) => r.suggestedTier === "community").length}`)
  console.log(`Unverified: ${results.filter((r) => r.suggestedTier === "unverified").length}`)

  // Generate SQL Migration
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T\.]/g, "")
    .substring(0, 14)
  const sqlPath = path.join(process.cwd(), "supabase", "migrations", `${timestamp}00_enrich_service_data.sql`)

  let sqlContent = `-- Auto-generated service data enrichment (Authority Tiers + Resource Indicators)\n`
  sqlContent += `-- Generated: ${new Date().toISOString()}\n\n`

  results.forEach((r) => {
    const safeId = r.id.replace(/'/g, "''")
    // Derive service_area_size from inferred tier/scope logic (approximate)
    // We don't have direct access to scope here unless we read it from the service object
    // Luckily 'services' variable holds the full service objects
    const service = services.find((s) => s.id === r.id)
    let indicators = null

    if (service) {
      let areaSize = "local"

      // Priority 1: Use explicit scope if it's broad
      if (service.scope === "canada") areaSize = "national"
      else if (service.scope === "ontario") areaSize = "provincial"
      else if (service.scope === "regional") areaSize = "regional"
      // Priority 2: Infer from Authority Tier / Known IDs
      let staffSize: "small" | "medium" | "large" = "small"
      let budget: "small" | "medium" | "large" = "small"

      if (r.suggestedTier === "government" || r.suggestedTier === "healthcare") {
        staffSize = "large"
        budget = "large"
        areaSize = service.url?.includes(".gc.ca") ? "national" : "provincial"
      } else if (r.suggestedTier === "established_nonprofit") {
        const nationalIds = ["kids-help-phone", "trans-lifeline", "hope-for-wellness", "crisis-988"]
        if (nationalIds.some((id) => service.id.includes(id))) {
          areaSize = "national"
          staffSize = "large"
          budget = "large"
        } else {
          areaSize = service.scope === "ontario" ? "provincial" : "local"
          staffSize = "medium"
          budget = "medium"
        }
      }

      indicators = {
        service_area_size: areaSize,
        staff_size: staffSize,
        annual_budget: budget,
      }
    }

    const indicatorsJson = indicators ? `'${JSON.stringify(indicators)}'` : "NULL"

    sqlContent += `UPDATE services SET authority_tier = '${r.suggestedTier}', resource_indicators = ${indicatorsJson} WHERE id = '${safeId}';\n`
  })

  fs.writeFileSync(sqlPath, sqlContent)
  console.log(`\n✅ Valid SQL migration generated at: ${sqlPath}`)

  // Update services.json
  const dryRun = process.argv.includes("--dry-run")

  if (!dryRun) {
    const updatedServices = services.map((s) => {
      const result = results.find((r) => r.id === s.id)

      let areaSize = "local"
      let staffSize: "small" | "medium" | "large" = "small"
      let budget: "small" | "medium" | "large" = "small"

      if (s.scope === "canada") areaSize = "national"
      else if (s.scope === "ontario") areaSize = "provincial"
      else if (s.scope === "regional") areaSize = "regional"
      else {
        if (result?.suggestedTier === "government" || result?.suggestedTier === "healthcare") {
          areaSize = s.url?.includes(".gc.ca") ? "national" : "provincial"
          staffSize = "large"
          budget = "large"
        } else if (result?.suggestedTier === "established_nonprofit") {
          const nationalIds = ["kids-help-phone", "trans-lifeline", "hope-for-wellness", "crisis-988"]
          if (nationalIds.some((id) => s.id.includes(id))) {
            areaSize = "national"
            staffSize = "large"
            budget = "large"
          } else {
            staffSize = "medium"
            budget = "medium"
          }
        }
      }

      return {
        ...s,
        authority_tier: result?.suggestedTier,
        resource_indicators: {
          service_area_size: areaSize,
          staff_size: staffSize,
          annual_budget: budget,
        },
      }
    })

    const jsonPath = path.join(process.cwd(), "data", "services.json")
    fs.writeFileSync(jsonPath, JSON.stringify(updatedServices, null, 2))
    console.log(`✅ Updated data/services.json`)
  } else {
    console.log(`\nDry run: Skipping services.json update`)
  }
}

main()
