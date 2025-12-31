#!/usr/bin/env npx tsx
import { fetch211Services } from "../lib/external/211-client"
import { readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"
import type { Service } from "../types/service"

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")

async function main() {
  console.log("🔄 Fetching services from 211 Ontario...")
  const newServices = await fetch211Services()

  if (newServices.length === 0) {
    console.log("⚠️ No services fetched (or error occurred).")
    return
  }

  let existing: Service[] = []
  if (existsSync(SERVICES_PATH)) {
    existing = JSON.parse(readFileSync(SERVICES_PATH, "utf-8")) as Service[]
  }

  const existingIds = new Set(existing.map((s: Service) => s.id))

  // Only add new services, don't overwrite existing ones to preserve manual edits/tags
  // In a real system, we might want a merge strategy (e.g., update phone numbers but keep tags)
  const toAdd = newServices.filter((s) => !existingIds.has(s.id))

  if (toAdd.length === 0) {
    console.log("✅ No new services to add.")
    return
  }

  const merged = [...existing, ...toAdd]
  writeFileSync(SERVICES_PATH, JSON.stringify(merged, null, 2))
  console.log(`✅ Added ${toAdd.length} new services.`)
}

main().catch(console.error)
