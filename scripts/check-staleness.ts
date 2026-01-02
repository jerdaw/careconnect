#!/usr/bin/env npx tsx
import { readFileSync, appendFileSync } from "fs"
import path from "path"
import type { Service } from "../types/service"

const DATA_PATH = path.join(process.cwd(), "data/services.json")

// Staleness thresholds (in days)
const THRESHOLDS = {
  CRISIS: 30,    // Crisis services: monthly verification
  GENERAL: 90,   // General services: quarterly verification
  STALE: 180,    // Auto-downgrade threshold: 6 months
}

interface StalenessResult {
  service: Service
  lastVerified: Date | null
  daysSinceVerification: number | null
  status: "fresh" | "due" | "stale" | "unknown"
  recommendation: string
}

function getVerificationDate(service: Service): Date | null {
  // Try provenance.verified_at first, then last_verified
  const dateStr = service.provenance?.verified_at || service.last_verified
  if (!dateStr) return null
  
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

function getDaysSince(date: Date | null): number | null {
  if (!date) return null
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function checkStaleness(): StalenessResult[] {
  console.log("📅 Checking service staleness...")
  console.log(`   Thresholds: Crisis=${THRESHOLDS.CRISIS}d, General=${THRESHOLDS.GENERAL}d, Stale=${THRESHOLDS.STALE}d\n`)

  const rawData = readFileSync(DATA_PATH, "utf-8")
  const services = JSON.parse(rawData) as Service[]

  const results: StalenessResult[] = []

  for (const service of services) {
    const lastVerified = getVerificationDate(service)
    const daysSince = getDaysSince(lastVerified)
    const isCrisis = service.intent_category === "Crisis"
    const threshold = isCrisis ? THRESHOLDS.CRISIS : THRESHOLDS.GENERAL

    let status: StalenessResult["status"]
    let recommendation: string

    if (daysSince === null) {
      status = "unknown"
      recommendation = "Add verification date to provenance.verified_at"
    } else if (daysSince >= THRESHOLDS.STALE) {
      status = "stale"
      recommendation = `URGENT: Downgrade to L0 or verify immediately (${daysSince} days old)`
    } else if (daysSince >= threshold) {
      status = "due"
      recommendation = `Verification due (${daysSince} days since last verification)`
    } else {
      status = "fresh"
      recommendation = `OK (${daysSince} days since verification)`
    }

    results.push({
      service,
      lastVerified,
      daysSinceVerification: daysSince,
      status,
      recommendation,
    })
  }

  return results
}

function printResults(results: StalenessResult[]) {
  const stale = results.filter((r) => r.status === "stale")
  const due = results.filter((r) => r.status === "due")
  const unknown = results.filter((r) => r.status === "unknown")
  const fresh = results.filter((r) => r.status === "fresh")

  console.log("📊 Staleness Report:")
  console.log(`   Total services: ${results.length}`)
  console.log(`   ✅ Fresh: ${fresh.length}`)
  console.log(`   ⏰ Due for verification: ${due.length}`)
  console.log(`   🔴 STALE (>6 months): ${stale.length}`)
  console.log(`   ❓ Unknown (no date): ${unknown.length}`)

  if (stale.length > 0) {
    console.log("\n🔴 STALE SERVICES (require immediate attention):\n")
    for (const r of stale) {
      console.log(`   ${r.service.id}`)
      console.log(`      Name: ${r.service.name}`)
      console.log(`      Category: ${r.service.intent_category}`)
      console.log(`      Last verified: ${r.lastVerified?.toISOString().split("T")[0] || "never"}`)
      console.log(`      Days since: ${r.daysSinceVerification}`)
      console.log(`      Action: ${r.recommendation}`)
      console.log()
    }
  }

  if (due.length > 0) {
    console.log("\n⏰ SERVICES DUE FOR VERIFICATION:\n")
    for (const r of due) {
      console.log(`   - ${r.service.id} (${r.service.intent_category}): ${r.daysSinceVerification} days`)
    }
  }

  if (unknown.length > 0) {
    console.log("\n❓ SERVICES WITH NO VERIFICATION DATE:\n")
    for (const r of unknown) {
      // Just list the first 5 if there are many
      if (unknown.length > 10 && r === unknown[5]) {
         console.log(`   ... and ${unknown.length - 5} more`)
         return
      }
      if (unknown.length <= 10 || unknown.indexOf(r) < 5) {
        console.log(`   - ${r.service.id}`)
      }
    }
  }

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    // Safe handling for GITHUB_OUTPUT
    try {
        appendFileSync(process.env.GITHUB_OUTPUT, `stale_count=${stale.length}\n`)
        appendFileSync(process.env.GITHUB_OUTPUT, `due_count=${due.length}\n`)
        const staleIds = stale.map((r) => r.service.id).join(",")
        appendFileSync(process.env.GITHUB_OUTPUT, `stale_ids=${staleIds}\n`)
    } catch {
        // Ignore if not in GH Actions environment or permission issue
    }
  }
}

// Main execution
const results = checkStaleness()
printResults(results)

// We exit with 0 even if stale, as this is an audit tool, not a blocker
// But if specifically running as a "check", we can exit 1 if preferred.
// For now, let's exit 0 so it doesn't break CI, but the GH action will use the output to create issues.
process.exit(0)
