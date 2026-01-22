#!/usr/bin/env tsx
/**
 * Data Completeness Audit Script
 *
 * Analyzes the service dataset to identify missing fields and data quality gaps.
 * Generates a comprehensive report for data enrichment planning.
 *
 * Usage: npm run audit:data
 */

import fs from "fs/promises"
import path from "path"

interface Service {
  id: string
  name: string
  intent_category: string
  verification_level: string
  scope?: string
  coordinates?: { lat: number; lng: number }
  latitude?: number
  longitude?: number
  hours?: Record<string, unknown>
  hours_text?: string
  access_script?: string
  plain_language_available?: boolean
  address?: string
}

interface AuditResults {
  totalServices: number
  missingScope: number
  missingCoordinates: number
  missingAccessScript: number
  missingPlainLanguage: number
  missingHours: number
  missingHoursText: number
  verificationBreakdown: Record<string, number>
  categoryBreakdown: Record<string, number>
  gapsByCategory: Record<
    string,
    {
      total: number
      missingScope: number
      missingCoords: number
      missingAccessScript: number
    }
  >
}

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

function hasCoordinates(service: Service): boolean {
  return !!(service.coordinates || (service.latitude && service.longitude))
}

async function auditServices(): Promise<AuditResults> {
  const services = await loadServices()

  const results: AuditResults = {
    totalServices: services.length,
    missingScope: 0,
    missingCoordinates: 0,
    missingAccessScript: 0,
    missingPlainLanguage: 0,
    missingHours: 0,
    missingHoursText: 0,
    verificationBreakdown: {},
    categoryBreakdown: {},
    gapsByCategory: {},
  }

  services.forEach((service) => {
    // Count missing fields
    if (!service.scope) results.missingScope++
    if (!hasCoordinates(service)) results.missingCoordinates++
    if (!service.access_script) results.missingAccessScript++
    if (service.plain_language_available === undefined || service.plain_language_available === null) {
      results.missingPlainLanguage++
    }
    if (!service.hours) results.missingHours++
    if (!service.hours_text) results.missingHoursText++

    // Verification breakdown
    const level = service.verification_level || "Unknown"
    results.verificationBreakdown[level] = (results.verificationBreakdown[level] || 0) + 1

    // Category breakdown
    const category = service.intent_category || "Unknown"
    results.categoryBreakdown[category] = (results.categoryBreakdown[category] || 0) + 1

    // Gaps by category
    if (!results.gapsByCategory[category]) {
      results.gapsByCategory[category] = {
        total: 0,
        missingScope: 0,
        missingCoords: 0,
        missingAccessScript: 0,
      }
    }
    results.gapsByCategory[category].total++
    if (!service.scope) results.gapsByCategory[category].missingScope++
    if (!hasCoordinates(service)) results.gapsByCategory[category].missingCoords++
    if (!service.access_script) results.gapsByCategory[category].missingAccessScript++
  })

  return results
}

function formatPercentage(value: number, total: number): string {
  return `${value} (${Math.round((value / total) * 100)}%)`
}

async function main() {
  console.log("📊 Data Completeness Audit")
  console.log("═".repeat(60))
  console.log("")

  const results = await auditServices()

  console.log("📈 Overall Metrics:")
  console.log(`  Total Services: ${results.totalServices}`)
  console.log("")

  console.log("❌ Missing Fields:")
  console.log(`  Scope:                    ${formatPercentage(results.missingScope, results.totalServices)}`)
  console.log(`  Coordinates:              ${formatPercentage(results.missingCoordinates, results.totalServices)}`)
  console.log(`  Access Script:            ${formatPercentage(results.missingAccessScript, results.totalServices)}`)
  console.log(`  Plain Language Flag:      ${formatPercentage(results.missingPlainLanguage, results.totalServices)}`)
  console.log(`  Structured Hours:         ${formatPercentage(results.missingHours, results.totalServices)}`)
  console.log(`  Hours Text:               ${formatPercentage(results.missingHoursText, results.totalServices)}`)
  console.log("")

  console.log("✅ Verification Levels:")
  Object.entries(results.verificationBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([level, count]) => {
      console.log(`  ${level}: ${count}`)
    })
  console.log("")

  console.log("📁 Services by Category:")
  Object.entries(results.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`)
    })
  console.log("")

  console.log("🔍 Data Gaps by Category:")
  Object.entries(results.gapsByCategory)
    .sort(([, a], [, b]) => b.total - a.total)
    .forEach(([category, gaps]) => {
      const pctScope = Math.round((gaps.missingScope / gaps.total) * 100)
      const pctCoords = Math.round((gaps.missingCoords / gaps.total) * 100)
      const pctScript = Math.round((gaps.missingAccessScript / gaps.total) * 100)

      console.log(`  ${category} (${gaps.total} services):`)
      console.log(`    Missing Scope: ${gaps.missingScope} (${pctScope}%)`)
      console.log(`    Missing Coords: ${gaps.missingCoords} (${pctCoords}%)`)
      console.log(`    Missing Script: ${gaps.missingAccessScript} (${pctScript}%)`)
    })
  console.log("")

  console.log("═".repeat(60))
  console.log("✅ Audit complete")
}

main().catch((error) => {
  console.error("Error running audit:", error)
  process.exit(1)
})
