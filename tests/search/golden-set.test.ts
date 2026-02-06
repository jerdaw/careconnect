/**
 * Golden Set Search Tests
 *
 * Deterministic regression tests for search quality.
 * These tests verify that critical services appear in search results.
 *
 * Run: npm test -- tests/search/golden-set.test.ts
 */

import { describe, it, expect } from "vitest"
import { searchServices } from "@/lib/search"
import { detectCrisis } from "@/lib/search/crisis"
import testQueries from "../fixtures/search-test-queries.json"

interface GoldenQuery {
  id: string
  query: string
  quality: "well" | "average" | "poor"
  category: string
  subCategory: string
  expectedServices: string[]
  mustIncludeAtLeastOne: string[]
  notes?: string
}

const goldenQueries = testQueries.goldenSet.queries as GoldenQuery[]

describe("Search Golden Set", () => {
  // Group tests by category for better organization
  const categorizedQueries = goldenQueries.reduce(
    (acc, q) => {
      const existing = acc[q.category]
      if (!existing) {
        acc[q.category] = [q]
      } else {
        existing.push(q)
      }
      return acc
    },
    {} as Record<string, GoldenQuery[]>
  )

  // Generate tests for each category
  Object.entries(categorizedQueries).forEach(([category, queries]) => {
    describe(`Category: ${category}`, () => {
      queries.forEach((gq) => {
        it(`[${gq.id}] "${gq.query}" should include expected services`, async () => {
          const results = await searchServices(gq.query)
          const top10Ids = results.slice(0, 10).map((r) => r.service.id)

          // Must include at least one of the critical services in top 10
          const foundCritical = gq.mustIncludeAtLeastOne.some((id) => top10Ids.includes(id))

          if (!foundCritical) {
            // Provide helpful failure message
            const top3 = results
              .slice(0, 3)
              .map((r) => `${r.service.id} (${r.score.toFixed(0)})`)
              .join(", ")
            expect.fail(
              `Expected one of [${gq.mustIncludeAtLeastOne.join(", ")}] in top 10.\n` +
                `Got: ${top3 || "no results"}\n` +
                `Total results: ${results.length}`
            )
          }

          expect(foundCritical).toBe(true)
        })
      })
    })
  })
})

describe("Search Crisis Detection", () => {
  const crisisQueries = [
    // Suicide/self-harm
    { query: "I want to kill myself", shouldDetect: true },
    { query: "suicidal thoughts", shouldDetect: true },
    { query: "suicide hotline", shouldDetect: true },
    { query: "overdose help", shouldDetect: true },
    // Violence/abuse
    { query: "I'm being abused", shouldDetect: true },
    { query: "my partner hits me", shouldDetect: true },
    // Non-crisis
    { query: "food bank", shouldDetect: false },
    { query: "job search", shouldDetect: false },
    { query: "dental clinic", shouldDetect: false },
  ]

  crisisQueries.forEach(({ query, shouldDetect }) => {
    it(`"${query}" should ${shouldDetect ? "" : "NOT "}trigger crisis detection`, () => {
      const detected = detectCrisis(query)
      expect(detected).toBe(shouldDetect)
    })
  })
})

describe("Search Coverage", () => {
  it("should return results for 95%+ of sampled queries", async () => {
    const sampledQueries = testQueries.sampledCoverage.queries
    let withResults = 0
    const noResults: string[] = []

    for (const sq of sampledQueries) {
      const results = await searchServices(sq.query)
      if (results.length > 0) {
        withResults++
      } else {
        noResults.push(sq.query)
      }
    }

    const resultRate = withResults / sampledQueries.length

    if (resultRate < 0.95) {
      console.log("Queries with no results:", noResults)
    }

    expect(resultRate).toBeGreaterThanOrEqual(0.95)
  })
})

describe("Search Performance", () => {
  it("should complete 50 queries in under 5 seconds", async () => {
    const start = Date.now()

    for (const gq of goldenQueries) {
      await searchServices(gq.query)
    }

    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000)
  })
})
