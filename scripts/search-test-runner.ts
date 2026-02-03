/**
 * Comprehensive Search Test Runner
 *
 * Executes all test queries from tests/fixtures/search-test-queries.json
 * and produces a detailed evaluation report.
 *
 * Run: npx tsx scripts/search-test-runner.ts
 * Output: tests/fixtures/search-test-results.json
 */

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import fs from "fs"
import path from "path"

// Types for test queries
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

interface SampledQuery {
  id: string
  query: string
  category: string
  subCategory: string
  expectedCategories: string[]
  notes?: string
}

interface TestQueries {
  goldenSet: { queries: GoldenQuery[] }
  sampledCoverage: { queries: SampledQuery[] }
}

// Result types
interface ServiceResult {
  id: string
  name: string
  score: number
  matchReasons: string[]
  rank: number
}

interface GoldenResult {
  id: string
  query: string
  quality: string
  category: string
  subCategory: string
  expectedServices: string[]
  mustIncludeAtLeastOne: string[]
  notes?: string
  // Results
  crisisDetected: boolean
  totalResults: number
  top10: ServiceResult[]
  // Evaluation
  mustIncludeFound: boolean
  mustIncludeRank: number | null
  mustIncludeService: string | null
  expectedRecall: number
  expectedInTop10: string[]
  expectedMissing: string[]
  pass: boolean
}

interface SampledResult {
  id: string
  query: string
  category: string
  subCategory: string
  expectedCategories: string[]
  notes?: string
  // Results
  crisisDetected: boolean
  totalResults: number
  top5: ServiceResult[]
  // Evaluation
  hasResults: boolean
}

interface TestReport {
  metadata: {
    runAt: string
    totalQueries: number
    goldenSetCount: number
    sampledCoverageCount: number
    executionTimeMs: number
  }
  summary: {
    goldenSet: {
      total: number
      passed: number
      failed: number
      passRate: number
      avgRecall: number
      byQuality: {
        well: { total: number; passed: number }
        average: { total: number; passed: number }
        poor: { total: number; passed: number }
      }
      byCategory: Record<string, { total: number; passed: number }>
    }
    sampledCoverage: {
      total: number
      withResults: number
      noResults: number
      resultRate: number
    }
    crisisDetection: {
      expectedCrisis: number
      detectedCrisis: number
      accuracy: number
    }
  }
  goldenResults: GoldenResult[]
  sampledResults: SampledResult[]
  failures: {
    goldenSet: GoldenResult[]
    noResults: SampledResult[]
  }
}

;(async () => {
  // Dynamic imports after dotenv is loaded
  const { searchServices } = await import("../lib/search")
  const { detectCrisis } = await import("../lib/search/crisis")

  async function runTests(): Promise<TestReport> {
    const startTime = Date.now()

    // Load test queries
    const testQueriesPath = path.join(__dirname, "../tests/fixtures/search-test-queries.json")
    const testQueries: TestQueries = JSON.parse(fs.readFileSync(testQueriesPath, "utf-8"))

    const goldenResults: GoldenResult[] = []
    const sampledResults: SampledResult[] = []

    console.log("🧪 Search Test Runner\n")
    console.log("=".repeat(60))
    console.log(`\nRunning ${testQueries.goldenSet.queries.length} golden set queries...`)

    // Run golden set queries
    for (const gq of testQueries.goldenSet.queries) {
      const results = await searchServices(gq.query)
      const crisisDetected = detectCrisis(gq.query)

      const top10: ServiceResult[] = results.slice(0, 10).map((r, i) => ({
        id: r.service.id,
        name: r.service.name,
        score: r.score,
        matchReasons: r.matchReasons,
        rank: i + 1,
      }))

      const top10Ids = top10.map((r) => r.id)

      // Check mustIncludeAtLeastOne
      const mustIncludeFound = gq.mustIncludeAtLeastOne.some((id) => top10Ids.includes(id))
      let mustIncludeRank: number | null = null
      let mustIncludeService: string | null = null
      for (const id of gq.mustIncludeAtLeastOne) {
        const idx = top10Ids.indexOf(id)
        if (idx !== -1) {
          mustIncludeRank = idx + 1
          mustIncludeService = id
          break
        }
      }

      // Calculate recall
      const expectedInTop10 = gq.expectedServices.filter((id) => top10Ids.includes(id))
      const expectedMissing = gq.expectedServices.filter((id) => !top10Ids.includes(id))
      const expectedRecall = gq.expectedServices.length > 0 ? expectedInTop10.length / gq.expectedServices.length : 1

      // Pass criteria: mustInclude in top 10 (recall is informational, not blocking)
      const pass = mustIncludeFound

      goldenResults.push({
        id: gq.id,
        query: gq.query,
        quality: gq.quality,
        category: gq.category,
        subCategory: gq.subCategory,
        expectedServices: gq.expectedServices,
        mustIncludeAtLeastOne: gq.mustIncludeAtLeastOne,
        notes: gq.notes,
        crisisDetected,
        totalResults: results.length,
        top10,
        mustIncludeFound,
        mustIncludeRank,
        mustIncludeService,
        expectedRecall,
        expectedInTop10,
        expectedMissing,
        pass,
      })

      // Progress indicator
      process.stdout.write(pass ? "." : "x")
    }

    console.log(`\n\nRunning ${testQueries.sampledCoverage.queries.length} sampled coverage queries...`)

    // Run sampled coverage queries
    for (const sq of testQueries.sampledCoverage.queries) {
      const results = await searchServices(sq.query)
      const crisisDetected = detectCrisis(sq.query)

      const top5: ServiceResult[] = results.slice(0, 5).map((r, i) => ({
        id: r.service.id,
        name: r.service.name,
        score: r.score,
        matchReasons: r.matchReasons,
        rank: i + 1,
      }))

      sampledResults.push({
        id: sq.id,
        query: sq.query,
        category: sq.category,
        subCategory: sq.subCategory,
        expectedCategories: sq.expectedCategories,
        notes: sq.notes,
        crisisDetected,
        totalResults: results.length,
        top5,
        hasResults: results.length > 0,
      })

      // Progress indicator
      process.stdout.write(results.length > 0 ? "." : "x")
    }

    console.log("\n")

    // Calculate summary statistics
    const goldenPassed = goldenResults.filter((r) => r.pass).length
    const goldenFailed = goldenResults.filter((r) => !r.pass).length

    const byQuality = {
      well: {
        total: goldenResults.filter((r) => r.quality === "well").length,
        passed: goldenResults.filter((r) => r.quality === "well" && r.pass).length,
      },
      average: {
        total: goldenResults.filter((r) => r.quality === "average").length,
        passed: goldenResults.filter((r) => r.quality === "average" && r.pass).length,
      },
      poor: {
        total: goldenResults.filter((r) => r.quality === "poor").length,
        passed: goldenResults.filter((r) => r.quality === "poor" && r.pass).length,
      },
    }

    const byCategory: Record<string, { total: number; passed: number }> = {}
    for (const r of goldenResults) {
      if (!byCategory[r.category]) {
        byCategory[r.category] = { total: 0, passed: 0 }
      }
      byCategory[r.category].total++
      if (r.pass) byCategory[r.category].passed++
    }

    const avgRecall = goldenResults.reduce((sum, r) => sum + r.expectedRecall, 0) / goldenResults.length

    const sampledWithResults = sampledResults.filter((r) => r.hasResults).length
    const sampledNoResults = sampledResults.filter((r) => !r.hasResults).length

    // Crisis detection accuracy
    const crisisCategories = ["crisis"]
    const expectedCrisis = [...goldenResults, ...sampledResults].filter(
      (r) =>
        crisisCategories.includes(r.category) || r.subCategory?.includes("suicide") || r.subCategory?.includes("crisis")
    ).length
    const detectedCrisis = [...goldenResults, ...sampledResults].filter((r) => r.crisisDetected).length

    const executionTimeMs = Date.now() - startTime

    const report: TestReport = {
      metadata: {
        runAt: new Date().toISOString(),
        totalQueries: goldenResults.length + sampledResults.length,
        goldenSetCount: goldenResults.length,
        sampledCoverageCount: sampledResults.length,
        executionTimeMs,
      },
      summary: {
        goldenSet: {
          total: goldenResults.length,
          passed: goldenPassed,
          failed: goldenFailed,
          passRate: goldenPassed / goldenResults.length,
          avgRecall,
          byQuality,
          byCategory,
        },
        sampledCoverage: {
          total: sampledResults.length,
          withResults: sampledWithResults,
          noResults: sampledNoResults,
          resultRate: sampledWithResults / sampledResults.length,
        },
        crisisDetection: {
          expectedCrisis,
          detectedCrisis,
          accuracy: expectedCrisis > 0 ? Math.min(detectedCrisis / expectedCrisis, 1) : 1,
        },
      },
      goldenResults,
      sampledResults,
      failures: {
        goldenSet: goldenResults.filter((r) => !r.pass),
        noResults: sampledResults.filter((r) => !r.hasResults),
      },
    }

    return report
  }

  const report = await runTests()

  // Save full report
  const outputPath = path.join(__dirname, "../tests/fixtures/search-test-results.json")
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Full report saved to: ${outputPath}`)

  // Print summary
  console.log("\n" + "=".repeat(60))
  console.log("📊 SUMMARY")
  console.log("=".repeat(60))

  console.log(`\n⏱️  Execution Time: ${report.metadata.executionTimeMs}ms`)
  console.log(`📝 Total Queries: ${report.metadata.totalQueries}`)

  console.log(`\n🎯 GOLDEN SET (${report.summary.goldenSet.total} queries):`)
  console.log(
    `   Pass Rate: ${(report.summary.goldenSet.passRate * 100).toFixed(1)}% (${report.summary.goldenSet.passed}/${report.summary.goldenSet.total})`
  )
  console.log(`   Avg Recall: ${(report.summary.goldenSet.avgRecall * 100).toFixed(1)}%`)
  console.log(`   By Quality:`)
  console.log(
    `     Well-worded:    ${report.summary.goldenSet.byQuality.well.passed}/${report.summary.goldenSet.byQuality.well.total}`
  )
  console.log(
    `     Average:        ${report.summary.goldenSet.byQuality.average.passed}/${report.summary.goldenSet.byQuality.average.total}`
  )
  console.log(
    `     Poor:           ${report.summary.goldenSet.byQuality.poor.passed}/${report.summary.goldenSet.byQuality.poor.total}`
  )

  console.log(`\n📋 SAMPLED COVERAGE (${report.summary.sampledCoverage.total} queries):`)
  console.log(
    `   Result Rate: ${(report.summary.sampledCoverage.resultRate * 100).toFixed(1)}% (${report.summary.sampledCoverage.withResults}/${report.summary.sampledCoverage.total})`
  )
  console.log(`   No Results: ${report.summary.sampledCoverage.noResults}`)

  console.log(`\n🚨 CRISIS DETECTION:`)
  console.log(`   Expected Crisis Queries: ${report.summary.crisisDetection.expectedCrisis}`)
  console.log(`   Detected as Crisis: ${report.summary.crisisDetection.detectedCrisis}`)

  if (report.failures.goldenSet.length > 0) {
    console.log(`\n❌ GOLDEN SET FAILURES (${report.failures.goldenSet.length}):`)
    for (const f of report.failures.goldenSet.slice(0, 10)) {
      console.log(`\n   ${f.id}: "${f.query}"`)
      console.log(`     Expected: ${f.mustIncludeAtLeastOne.join(" OR ")}`)
      console.log(
        `     Got top 3: ${
          f.top10
            .slice(0, 3)
            .map((r) => r.id)
            .join(", ") || "No results"
        }`
      )
      console.log(`     Recall: ${(f.expectedRecall * 100).toFixed(0)}%`)
    }
    if (report.failures.goldenSet.length > 10) {
      console.log(`\n   ... and ${report.failures.goldenSet.length - 10} more failures`)
    }
  }

  if (report.failures.noResults.length > 0) {
    console.log(`\n⚠️  QUERIES WITH NO RESULTS (${report.failures.noResults.length}):`)
    for (const f of report.failures.noResults.slice(0, 10)) {
      console.log(`   ${f.id}: "${f.query}"`)
    }
    if (report.failures.noResults.length > 10) {
      console.log(`   ... and ${report.failures.noResults.length - 10} more`)
    }
  }

  console.log("\n" + "=".repeat(60))

  // Exit code based on pass rate
  const overallPassRate = report.summary.goldenSet.passRate
  if (overallPassRate < 0.7) {
    console.log("\n🔴 FAIL: Pass rate below 70%")
    process.exit(1)
  } else if (overallPassRate < 0.85) {
    console.log("\n🟡 WARNING: Pass rate below 85%")
    process.exit(0)
  } else {
    console.log("\n🟢 PASS: Search quality is good!")
    process.exit(0)
  }
})()
