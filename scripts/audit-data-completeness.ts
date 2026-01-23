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
  virtual_delivery?: boolean
  hours?: Record<string, unknown>
  hours_text?: string
  access_script?: string
  plain_language_available?: boolean
  address?: string
  published?: boolean
  status?: string
  deleted_at?: string | null
}

interface AuditResults {
  totalServices: number
  missingScope: number
  missingCoordinates: number
  missingCoordinatesRequired: number
  missingCoordinatesGeocodable: number
  kingstonPhysicalMissingAddress: number
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
      missingCoordsAny: number
      missingCoordsRequired: number
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

function isActive(service: Service): boolean {
  if (service.deleted_at) return false
  if (service.published === false) return false
  if (service.status && service.status.toLowerCase().includes("permanently closed")) return false
  return true
}

function isGeocodableAddress(address: string): boolean {
  const trimmed = address.trim()
  if (trimmed.length === 0) return false

  // Avoid wasting calls on known non-geocodable placeholder/location notes.
  if (/(virtual|confidential|various|pop-?up|moved|call|phone|online|mailing|po box|p\.?o\.?\s*box)/i.test(trimmed)) {
    return false
  }

  // Require at least one digit (street number) OR a Canadian postal code.
  const hasDigit = /\d/.test(trimmed)
  const hasCanadianPostalCode = /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/i.test(trimmed)

  return hasDigit || hasCanadianPostalCode
}

function requiresCoordinates(service: Service): boolean {
  if (!isActive(service)) return false
  if (service.scope !== "kingston") return false
  if (service.virtual_delivery === true) return false
  return true
}

async function auditServices(): Promise<AuditResults> {
  const services = await loadServices()

  const results: AuditResults = {
    totalServices: services.length,
    missingScope: 0,
    missingCoordinates: 0,
    missingCoordinatesRequired: 0,
    missingCoordinatesGeocodable: 0,
    kingstonPhysicalMissingAddress: 0,
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
    const hasCoords = hasCoordinates(service)
    if (!hasCoords) results.missingCoordinates++
    if (!hasCoords && requiresCoordinates(service)) {
      results.missingCoordinatesRequired++
      if (!service.address || service.address.trim().length === 0) {
        results.kingstonPhysicalMissingAddress++
      } else if (isGeocodableAddress(service.address)) {
        results.missingCoordinatesGeocodable++
      }
    }
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
        missingCoordsAny: 0,
        missingCoordsRequired: 0,
        missingAccessScript: 0,
      }
    }
    results.gapsByCategory[category].total++
    if (!service.scope) results.gapsByCategory[category].missingScope++
    if (!hasCoords) results.gapsByCategory[category].missingCoordsAny++
    if (!hasCoords && requiresCoordinates(service)) results.gapsByCategory[category].missingCoordsRequired++
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
  console.log(`  Coordinates (any):        ${formatPercentage(results.missingCoordinates, results.totalServices)}`)
  console.log(
    `  Coordinates (required):   ${formatPercentage(results.missingCoordinatesRequired, results.totalServices)}`
  )
  console.log(
    `  Coordinates (geocodable): ${formatPercentage(results.missingCoordinatesGeocodable, results.totalServices)}`
  )
  console.log(
    `  Kingston missing address: ${formatPercentage(results.kingstonPhysicalMissingAddress, results.totalServices)}`
  )
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
      const pctCoordsAny = Math.round((gaps.missingCoordsAny / gaps.total) * 100)
      const pctCoordsRequired = Math.round((gaps.missingCoordsRequired / gaps.total) * 100)
      const pctScript = Math.round((gaps.missingAccessScript / gaps.total) * 100)

      console.log(`  ${category} (${gaps.total} services):`)
      console.log(`    Missing Scope: ${gaps.missingScope} (${pctScope}%)`)
      console.log(`    Missing Coords (any): ${gaps.missingCoordsAny} (${pctCoordsAny}%)`)
      console.log(`    Missing Coords (required): ${gaps.missingCoordsRequired} (${pctCoordsRequired}%)`)
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
