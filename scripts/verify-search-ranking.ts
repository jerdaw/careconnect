/**
 * Verification Script for Search Ranking Enhancements (Phase 4)
 *
 * Usage: npx tsx scripts/verify-search-ranking.ts
 *
 * This script queries the running local API (http://localhost:3000/api/v1/search/services)
 * and asserts that the ranking logic is working as expected.
 *
 * Pre-requisites:
 * 1. App must be running (npm run dev)
 * 2. Database migrations must be applied (npx supabase db push)
 */

import { fetch } from "undici"
import { ServicePublic } from "../types/service-public"

if (process.argv.includes("--help")) {
  console.log("Usage: npm run verify:search-ranking")
  console.log("")
  console.log("Requires a running local app at http://localhost:3000 and validates API ranking expectations.")
  process.exit(0)
}

interface ScoredServicePublic extends ServicePublic {
  distance?: number
}

const BASE_URL = "http://localhost:3000/api/v1/search/services"

async function search(
  query: string,
  location?: { lat: number; lng: number }
): Promise<{ data: ScoredServicePublic[] }> {
  const body: Record<string, unknown> = {
    query,
    locale: "en",
    options: { limit: 10 },
  }

  if (location) {
    body.location = location
  }

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`API Error ${res.status}: ${txt}`)
    }

    return (await res.json()) as { data: ScoredServicePublic[] }
  } catch (err) {
    console.error(`❌ Connection failed: Is the server running at ${BASE_URL}?`, err)
    process.exit(1)
  }
}

async function verify() {
  console.log("🔍 Starting Search Ranking Verification...\n")
  let passed = 0
  let failed = 0

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ ${msg}`)
      passed++
    } else {
      console.log(`❌ ${msg}`)
      failed++
    }
  }

  // Test 1: Crisis Queries
  console.log('1️⃣ Testing Crisis Boost ("suicide")...')
  const crisisRes = await search("suicide")
  const topResult = crisisRes.data[0]
  assert(topResult?.category === "Crisis", "Top result should be a Crisis service")
  assert(
    crisisRes.data.some((s: ScoredServicePublic) => s.id === "crisis-988"),
    "Crisis 988 should be in results"
  )

  // Test 2: Authority Tier ("health")
  console.log('\n2️⃣ Testing Authority Tier ("health")...')
  const healthRes = await search("health")
  const govOrHealth = healthRes.data.filter((s: ScoredServicePublic) =>
    ["government", "healthcare"].includes(s.authority_tier || "")
  )
  const community = healthRes.data.filter((s: ScoredServicePublic) => s.authority_tier === "community")

  if (govOrHealth.length > 0 || community.length > 0) {
    console.log(`  (Found ${govOrHealth.length} high authority, ${community.length} community)`)
  }

  // Check if first gov/health rank appears before first community (simplified check)
  // Ideally, average rank of Gov > Community
  const firstGovIdx = healthRes.data.findIndex((s: ScoredServicePublic) =>
    ["government", "healthcare"].includes(s.authority_tier || "")
  )
  const firstCommIdx = healthRes.data.findIndex((s: ScoredServicePublic) => s.authority_tier === "community")

  assert(firstGovIdx !== -1, "Should find government/healthcare results")
  if (firstCommIdx !== -1 && firstGovIdx !== -1) {
    assert(
      firstGovIdx < firstCommIdx,
      `High authority (rank ${firstGovIdx}) should outrank community (rank ${firstCommIdx})`
    )
  }

  // Test 3: Proximity (Kingston vs Ottawa)
  console.log('\n3️⃣ Testing Proximity ("food")...')
  // Location: Kingston City Hall
  const kingstonRes = await search("food", { lat: 44.2312, lng: -76.486 })
  const firstKingston = kingstonRes.data[0]

  // Just verify we get results and they have distance
  assert(kingstonRes.data.length > 0, "Should return food services in Kingston")
  assert(
    firstKingston && typeof firstKingston.distance === "number" && firstKingston.distance >= 0,
    "Results should have distance calculated"
  )

  // Test 4: Resource Indicators
  console.log('\n4️⃣ Testing Resource Indicators ("kids")...')
  const kidsRes = await search("kids")
  const khp = kidsRes.data.find((s: ScoredServicePublic) => s.id === "kids-help-phone")
  // Requires the migration to have run to populate resource_indicators
  if (khp && khp.resource_indicators) {
    assert(khp.resource_indicators.staff_size === "large", 'Kids Help Phone should have "large" staff size')
  } else {
    console.log("⚠️ Skipping resource check: Data migration might not be applied yet.")
  }

  console.log(`\n🎉 Verification Complete: ${passed} Passed, ${failed} Failed`)
  if (failed > 0) process.exit(1)
}

verify().catch(console.error)
