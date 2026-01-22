#!/usr/bin/env tsx
/**
 * Geocoding Script
 *
 * Geocodes service addresses using OpenCage API.
 * Caches results to avoid redundant API calls.
 *
 * Setup:
 *   1. Get free API key from https://opencagedata.com/ (2,500/day free tier)
 *   2. Add OPENCAGE_API_KEY to .env.local
 *
 * Usage: npx tsx scripts/geocode-services.ts
 */

import fs from "fs/promises"
import path from "path"
import dotenv from "dotenv"

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" })

interface Service {
  id: string
  name: string
  address?: string
  coordinates?: { lat: number; lng: number }
  latitude?: number
  longitude?: number
}

interface GeocodeCacheEntry {
  lat: number
  lng: number
  formatted: string
  confidence: number
}

interface GeocodeCache {
  [address: string]: GeocodeCacheEntry
}

const CACHE_FILE = path.join(process.cwd(), "data", "geocode-cache.json")
const RATE_LIMIT_MS = 1000 // 1 request per second

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

async function saveServices(services: Service[]): Promise<void> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  await fs.writeFile(servicesPath, JSON.stringify(services, null, 2) + "\n", "utf-8")
}

async function loadCache(): Promise<GeocodeCache> {
  try {
    const data = await fs.readFile(CACHE_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function saveCache(cache: GeocodeCache): Promise<void> {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n", "utf-8")
}

async function geocodeAddress(address: string, apiKey: string): Promise<GeocodeCacheEntry | null> {
  const url = new URL("https://api.opencagedata.com/geocode/v1/json")
  url.searchParams.set("q", address)
  url.searchParams.set("key", apiKey)
  url.searchParams.set("countrycode", "ca")
  url.searchParams.set("limit", "1")

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      return {
        lat: result.geometry.lat,
        lng: result.geometry.lng,
        formatted: result.formatted,
        confidence: result.confidence || 0,
      }
    }

    return null
  } catch (error) {
    console.error(`  ❌ Geocoding failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    return null
  }
}

function hasCoordinates(service: Service): boolean {
  return !!(service.coordinates || (service.latitude && service.longitude))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const apiKey = process.env.OPENCAGE_API_KEY
  if (!apiKey) {
    console.error("❌ Error: OPENCAGE_API_KEY environment variable not set")
    console.error("")
    console.error("Get a free API key from https://opencagedata.com/")
    console.error("Then run: OPENCAGE_API_KEY=your-key npx tsx scripts/geocode-services.ts")
    process.exit(1)
  }

  console.log("🌍 Geocoding Services")
  console.log("═".repeat(60))
  console.log("")

  const services = await loadServices()
  const cache = await loadCache()

  let successCount = 0
  let failureCount = 0
  let cachedCount = 0
  let skippedCount = 0
  const failures: Array<{ name: string; address?: string }> = []

  for (const service of services) {
    // Skip if already has coordinates
    if (hasCoordinates(service)) {
      skippedCount++
      continue
    }

    // Skip if no address
    if (!service.address) {
      console.log(`  ⏭️  ${service.name}: No address`)
      skippedCount++
      continue
    }

    // Check cache
    if (cache[service.address]) {
      const cached = cache[service.address]
      service.coordinates = {
        lat: cached.lat,
        lng: cached.lng,
      }
      cachedCount++
      console.log(`  💾 ${service.name}: ${cached.formatted} (cached)`)
      continue
    }

    // Geocode
    console.log(`  🔍 Geocoding: ${service.name}`)
    console.log(`     Address: ${service.address}`)

    const result = await geocodeAddress(service.address, apiKey)

    if (result) {
      service.coordinates = {
        lat: result.lat,
        lng: result.lng,
      }
      cache[service.address] = result
      successCount++
      console.log(`  ✅ ${result.formatted} (confidence: ${result.confidence})`)
    } else {
      failureCount++
      failures.push({ name: service.name, address: service.address })
      console.log(`  ❌ Failed to geocode`)
    }

    // Rate limit
    await sleep(RATE_LIMIT_MS)
    console.log("")
  }

  // Save results
  await saveServices(services)
  await saveCache(cache)

  console.log("═".repeat(60))
  console.log("")
  console.log("📊 Results:")
  console.log(`  New geocodes: ${successCount}`)
  console.log(`  From cache: ${cachedCount}`)
  console.log(`  Failed: ${failureCount}`)
  console.log(`  Skipped (no address or has coords): ${skippedCount}`)
  console.log("")

  if (failures.length > 0) {
    console.log("⚠️  Failed Geocodes (manual entry needed):")
    failures.forEach(({ name, address }) => {
      console.log(`  - ${name}`)
      console.log(`    Address: ${address}`)
    })
    console.log("")
    console.log("💡 To add coordinates manually:")
    console.log("   1. Look up address on Google Maps")
    console.log("   2. Right-click location → Copy coordinates")
    console.log("   3. Add to data/services.json:")
    console.log('      "coordinates": { "lat": 44.XXXX, "lng": -76.XXXX }')
    console.log("")
  }

  console.log("✅ Geocoding complete")
}

main().catch((error) => {
  console.error("Error running geocoding:", error)
  process.exit(1)
})
