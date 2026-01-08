#!/usr/bin/env npx tsx
/**
 * normalize-services.ts
 *
 * Migrates legacy service entries to the current schema format.
 * Fixes:
 * 1. Renames `website` → `url`
 * 2. Renames `category` → `intent_category` (with enum mapping)
 * 3. Converts string `hours` → structured ServiceHoursSchema object
 * 4. Renames `keywords` → `synthetic_queries`
 * 5. Adds missing `provenance` and `identity_tags` fields
 */

import { readFileSync, writeFileSync } from "fs"
import path from "path"

const DATA_PATH = path.join(process.cwd(), "data/services.json")

// Valid intent categories from the schema
type IntentCategory =
    | "Food"
    | "Crisis"
    | "Housing"
    | "Health"
    | "Legal"
    | "Wellness"
    | "Financial"
    | "Employment"
    | "Education"
    | "Transport"
    | "Community"
    | "Indigenous"

// Map legacy categories to valid intent categories
const CATEGORY_MAP: Record<string, IntentCategory> = {
    Health: "Health",
    Legal: "Legal",
    Crisis: "Crisis",
    Food: "Food",
    Housing: "Housing",
    Wellness: "Wellness",
    Financial: "Financial",
    Employment: "Employment",
    Education: "Education",
    Transport: "Transport",
    Community: "Community",
    Indigenous: "Indigenous",
}

interface LegacyService {
    id: string
    name: string
    description: string
    website?: string
    url?: string
    phone?: string
    category?: string
    intent_category?: string
    hours?: string | Record<string, unknown>
    keywords?: string[]
    synthetic_queries?: string[]
    provenance?: unknown
    identity_tags?: unknown[]
    [key: string]: unknown
}

function parseHoursString(hoursStr: string): Record<string, unknown> {
    // Try to parse common patterns
    const result: Record<string, unknown> = { notes: hoursStr }

    // Check for 24/7
    if (hoursStr.toLowerCase().includes("24/7") || hoursStr.toLowerCase().includes("24 hours")) {
        const allDay = { open: "00:00", close: "23:59" }
        return {
            monday: allDay,
            tuesday: allDay,
            wednesday: allDay,
            thursday: allDay,
            friday: allDay,
            saturday: allDay,
            sunday: allDay,
            notes: hoursStr,
        }
    }

    // For Mon-Fri patterns, set weekday hours
    if (hoursStr.toLowerCase().includes("mon-fri") || hoursStr.toLowerCase().includes("mon - fri")) {
        // Extract time if possible (simplified pattern)
        const timeMatch = hoursStr.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)
        if (timeMatch) {
            const openTime = parseTime(timeMatch[1])
            const closeTime = parseTime(timeMatch[2])
            const weekdayHours = { open: openTime, close: closeTime }
            return {
                monday: weekdayHours,
                tuesday: weekdayHours,
                wednesday: weekdayHours,
                thursday: weekdayHours,
                friday: weekdayHours,
                notes: hoursStr,
            }
        }
    }

    // Default: just return with notes
    return result
}

function parseTime(timeStr: string): string {
    // Convert "9am" or "5pm" or "8:30am" to 24-hour format
    const match = timeStr.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (!match) return "09:00"

    let hours = parseInt(match[1], 10)
    const minutes = match[2] ? match[2] : "00"
    const period = match[3]?.toLowerCase()

    if (period === "pm" && hours !== 12) hours += 12
    if (period === "am" && hours === 12) hours = 0

    return `${hours.toString().padStart(2, "0")}:${minutes}`
}

function normalizeService(service: LegacyService): LegacyService {
    const normalized = { ...service }
    let wasModified = false

    // 1. Rename website → url
    if (normalized.website && !normalized.url) {
        normalized.url = normalized.website
        delete normalized.website
        wasModified = true
    }

    // 2. Rename category → intent_category
    if (normalized.category && !normalized.intent_category) {
        const mappedCategory = CATEGORY_MAP[normalized.category]
        if (mappedCategory) {
            normalized.intent_category = mappedCategory
        } else {
            // Default to Community if unknown
            normalized.intent_category = "Community"
            console.warn(`  ⚠️  Unknown category "${normalized.category}" for ${normalized.id}, defaulting to "Community"`)
        }
        delete normalized.category
        wasModified = true
    }

    // 3. Convert string hours → structured object
    if (typeof normalized.hours === "string") {
        normalized.hours = parseHoursString(normalized.hours)
        wasModified = true
    }

    // 4. Rename keywords → synthetic_queries
    if (normalized.keywords && !normalized.synthetic_queries) {
        normalized.synthetic_queries = normalized.keywords
        delete normalized.keywords
        wasModified = true
    }

    // 5. Add missing provenance
    if (!normalized.provenance) {
        normalized.provenance = {
            verified_by: "Pending manual verification",
            verified_at: new Date().toISOString(),
            evidence_url: normalized.url || "https://example.com",
            method: "Schema migration - requires verification",
        }
        wasModified = true
    }

    // 6. Add missing identity_tags
    if (!normalized.identity_tags) {
        normalized.identity_tags = []
        wasModified = true
    }

    // 7. Ensure synthetic_queries exists
    if (!normalized.synthetic_queries) {
        normalized.synthetic_queries = []
        wasModified = true
    }

    if (wasModified) {
        console.log(`  ✅ Normalized: ${normalized.name}`)
    }

    return normalized
}

function main() {
    console.log("🔧 Normalizing services.json...\n")

    const rawData = readFileSync(DATA_PATH, "utf-8")
    const services = JSON.parse(rawData) as LegacyService[]

    console.log(`📦 Found ${services.length} services\n`)

    let modifiedCount = 0
    const normalizedServices = services.map((service) => {
        const normalized = normalizeService(service)
        if (JSON.stringify(normalized) !== JSON.stringify(service)) {
            modifiedCount++
        }
        return normalized
    })

    // Write back
    writeFileSync(DATA_PATH, JSON.stringify(normalizedServices, null, 2) + "\n")

    console.log(`\n🎉 Normalization complete!`)
    console.log(`   Modified: ${modifiedCount} services`)
    console.log(`   Total: ${services.length} services`)
}

main()
