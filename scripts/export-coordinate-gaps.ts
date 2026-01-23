/**
 * Coordinate Gap Export
 *
 * Produces a machine-readable report for Phase 3 (Geocoding & Coordinates).
 *
 * Goal: identify services where coordinates are missing AND should be present for distance search,
 * without forcing coordinates onto virtual/phone-only resources.
 *
 * Usage:
 *   node --import tsx scripts/export-coordinate-gaps.ts
 *   node --import tsx scripts/export-coordinate-gaps.ts --out docs/roadmaps/v17-5-coordinates/outputs/coordinate-gaps.json
 *   node --import tsx scripts/export-coordinate-gaps.ts --all --out docs/roadmaps/v17-5-coordinates/outputs/coordinate-gaps.all.json
 */

import fs from "fs/promises"
import path from "path"

interface Service {
  id: string
  name: string
  intent_category?: string
  scope?: string
  url?: string
  phone?: string
  status?: string
  published?: boolean
  deleted_at?: string | null
  virtual_delivery?: boolean
  address?: string
  coordinates?: { lat: number; lng: number }
  latitude?: number
  longitude?: number
}

interface CoordinateGapItem {
  id: string
  name: string
  intent_category: string | null
  scope: string | null
  url: string | null
  phone: string | null
  status: string | null
  published: boolean | null
  virtual_delivery: boolean | null
  address: string | null
  has_coordinates: boolean
  address_required: boolean
  address_geocodable: boolean
  coordinates_required: boolean
  issues: string[]
}

interface CoordinateGapReport {
  generated_at: string
  emits_only_issues: boolean
  issues_breakdown: Record<string, number>
  totals: {
    total_services: number
    missing_coordinates_any: number
    address_required_missing_address: number
    address_required_non_geocodable_address: number
    coordinates_required_missing_coordinates: number
  }
  items: CoordinateGapItem[]
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

  if (/(virtual|confidential|various|pop-?up|moved|call|phone|online|mailing|po box|p\.?o\.?\s*box)/i.test(trimmed)) {
    return false
  }

  const hasDigit = /\d/.test(trimmed)
  const hasCanadianPostalCode = /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/i.test(trimmed)

  return hasDigit || hasCanadianPostalCode
}

function addressRequiredForDistanceSearch(service: Service): boolean {
  if (!isActive(service)) return false
  if (service.scope !== "kingston") return false
  if (service.virtual_delivery === true) return false
  return true
}

function parseArgs(argv: string[]): { outPath: string | null; all: boolean } {
  const outIndex = argv.indexOf("--out")
  const outPath = outIndex >= 0 ? argv[outIndex + 1] : null
  if (outIndex >= 0 && (!outPath || outPath.startsWith("--"))) {
    throw new Error("Invalid --out value. Example: --out docs/roadmaps/v17-5-coordinates/outputs/coordinate-gaps.json")
  }
  const all = argv.includes("--all")
  return { outPath, all }
}

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

async function main() {
  const { outPath, all } = parseArgs(process.argv.slice(2))

  const services = await loadServices()

  let missingAny = 0
  let missingAddressRequired = 0
  let nonGeocodableAddressRequired = 0
  let missingCoordinatesRequired = 0

  const itemsAll: CoordinateGapItem[] = services.map((service) => {
    const hasCoords = hasCoordinates(service)
    if (!hasCoords) missingAny++

    const addressRequired = addressRequiredForDistanceSearch(service)
    const address = service.address?.trim() ? service.address.trim() : null
    const addressGeocodable = !!(address && isGeocodableAddress(address))
    const coordinatesRequired = addressRequired && addressGeocodable

    const issues: string[] = []
    if (addressRequired && !address) {
      issues.push("missing_address")
      missingAddressRequired++
    }
    if (addressRequired && address && !addressGeocodable) {
      issues.push("non_geocodable_address")
      nonGeocodableAddressRequired++
    }
    if (coordinatesRequired && !hasCoords) {
      issues.push("missing_coordinates")
      missingCoordinatesRequired++
    }

    return {
      id: service.id,
      name: service.name,
      intent_category: service.intent_category ?? null,
      scope: service.scope ?? null,
      url: service.url ?? null,
      phone: service.phone ?? null,
      status: service.status ?? null,
      published: service.published ?? null,
      virtual_delivery: service.virtual_delivery ?? null,
      address,
      has_coordinates: hasCoords,
      address_required: addressRequired,
      address_geocodable: addressGeocodable,
      coordinates_required: coordinatesRequired,
      issues,
    }
  })

  const items = all ? itemsAll : itemsAll.filter((item) => item.issues.length > 0)
  const issuesBreakdown: Record<string, number> = {}
  for (const item of itemsAll) {
    for (const issue of item.issues) {
      issuesBreakdown[issue] = (issuesBreakdown[issue] ?? 0) + 1
    }
  }

  const report: CoordinateGapReport = {
    generated_at: new Date().toISOString(),
    emits_only_issues: !all,
    issues_breakdown: issuesBreakdown,
    totals: {
      total_services: services.length,
      missing_coordinates_any: missingAny,
      address_required_missing_address: missingAddressRequired,
      address_required_non_geocodable_address: nonGeocodableAddressRequired,
      coordinates_required_missing_coordinates: missingCoordinatesRequired,
    },
    items,
  }

  const output = JSON.stringify(report, null, 2) + "\n"

  if (outPath) {
    const absOut = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath)
    await fs.mkdir(path.dirname(absOut), { recursive: true })
    await fs.writeFile(absOut, output, "utf-8")
    console.log(`✅ Wrote coordinate gap report: ${outPath}`)
    return
  }

  process.stdout.write(output)
}

main().catch((error) => {
  console.error("Error exporting coordinate gaps:", error)
  process.exit(1)
})
