/**
 * Deterministic Search Quality Report Runner
 *
 * Evaluates the checked-in query fixture against checked-in local services at
 * the fixture's explicit evaluation date. It never loads Supabase credentials.
 *
 * Usage:
 *   npm run search:report
 *   npm run search:report:check
 *   node --import tsx scripts/search-test-runner.ts --write --out-dir <dir>
 */

import fs from "fs"
import path from "path"
import {
  buildSearchTestReport,
  formatSearchTestReportArtifacts,
  type GoldenResult,
  type SampledResult,
  type ServiceResult,
  type TestQueries,
} from "./search-test-report"

interface CliOptions {
  mode: "write" | "check"
  outputDir: string
}

const projectRoot = path.join(__dirname, "..")
const fixtureDir = path.join(projectRoot, "tests/fixtures")

function parseCliOptions(args: string[]): CliOptions {
  let mode: CliOptions["mode"] = "write"
  let outputDir = fixtureDir

  for (let index = 0; index < args.length; index++) {
    const argument = args[index]

    if (argument === "--write") {
      mode = "write"
      continue
    }
    if (argument === "--check") {
      mode = "check"
      continue
    }
    if (argument === "--out-dir") {
      const value = args[index + 1]
      if (!value) throw new Error("--out-dir requires a path")
      outputDir = path.resolve(process.cwd(), value)
      index++
      continue
    }

    throw new Error(`Unknown argument: ${argument}`)
  }

  return { mode, outputDir }
}

function installFixedDate(isoDate: string): () => void {
  const NativeDate = Date
  const fixedTime = NativeDate.parse(isoDate)
  if (Number.isNaN(fixedTime)) {
    throw new Error("search-test-queries metadata.evaluationAsOf must be a valid ISO date")
  }

  class FixedDate extends NativeDate {
    constructor(value?: string | number | Date) {
      if (value === undefined) {
        super(fixedTime)
      } else if (value instanceof NativeDate) {
        super(value.getTime())
      } else if (typeof value === "string") {
        super(value)
      } else {
        super(value)
      }
    }

    static now(): number {
      return fixedTime
    }
  }

  globalThis.Date = FixedDate as DateConstructor
  return () => {
    globalThis.Date = NativeDate
  }
}

function forceLocalDataMode(): void {
  process.env.NODE_ENV = "test"
  process.env.NEXT_PUBLIC_SEARCH_MODE = "local"
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  delete process.env.SUPABASE_SECRET_KEY
}

function readTestQueries(): TestQueries {
  const queryPath = path.join(fixtureDir, "search-test-queries.json")
  return JSON.parse(fs.readFileSync(queryPath, "utf8")) as TestQueries
}

async function runSearchEvaluation(testQueries: TestQueries) {
  forceLocalDataMode()
  const restoreDate = installFixedDate(testQueries.metadata.evaluationAsOf)
  const startedAt = performance.now()

  try {
    const [{ searchServices }, { detectCrisis }] = await Promise.all([
      import("../lib/search"),
      import("../lib/search/crisis"),
    ])
    const goldenResults: GoldenResult[] = []
    const sampledResults: SampledResult[] = []

    console.log("🧪 Deterministic Search Quality Report")
    console.log(`Evaluation date: ${testQueries.metadata.evaluationAsOf}`)
    console.log("Data source: checked-in local services")
    console.log(`Running ${testQueries.goldenSet.queries.length} golden queries...`)

    for (const queryFixture of testQueries.goldenSet.queries) {
      const results = await searchServices(queryFixture.query)
      const top10: ServiceResult[] = results.slice(0, 10).map((result, index) => ({
        id: result.service.id,
        name: result.service.name,
        score: result.score,
        matchReasons: result.matchReasons,
        rank: index + 1,
      }))
      const top10Ids = top10.map((result) => result.id)
      const matchedService = queryFixture.mustIncludeAtLeastOne.find((id) => top10Ids.includes(id)) ?? null
      const expectedInTop10 = queryFixture.expectedServices.filter((id) => top10Ids.includes(id))
      const expectedMissing = queryFixture.expectedServices.filter((id) => !top10Ids.includes(id))
      const expectedRecall =
        queryFixture.expectedServices.length === 0 ? 1 : expectedInTop10.length / queryFixture.expectedServices.length

      goldenResults.push({
        ...queryFixture,
        crisisDetected: detectCrisis(queryFixture.query),
        totalResults: results.length,
        top10,
        mustIncludeFound: matchedService !== null,
        mustIncludeRank: matchedService === null ? null : top10Ids.indexOf(matchedService) + 1,
        mustIncludeService: matchedService,
        expectedRecall,
        expectedInTop10,
        expectedMissing,
        pass: matchedService !== null,
      })
      process.stdout.write(matchedService === null ? "x" : ".")
    }

    console.log(`\nRunning ${testQueries.sampledCoverage.queries.length} sampled queries...`)
    for (const queryFixture of testQueries.sampledCoverage.queries) {
      const results = await searchServices(queryFixture.query)
      const top5: ServiceResult[] = results.slice(0, 5).map((result, index) => ({
        id: result.service.id,
        name: result.service.name,
        score: result.score,
        matchReasons: result.matchReasons,
        rank: index + 1,
      }))

      sampledResults.push({
        ...queryFixture,
        crisisDetected: detectCrisis(queryFixture.query),
        totalResults: results.length,
        top5,
        hasResults: results.length > 0,
      })
      process.stdout.write(results.length > 0 ? "." : "x")
    }
    console.log("")

    return {
      report: buildSearchTestReport({
        evaluationAsOf: testQueries.metadata.evaluationAsOf,
        goldenResults,
        sampledResults,
      }),
      executionTimeMs: Math.round(performance.now() - startedAt),
    }
  } finally {
    restoreDate()
  }
}

function outputFiles(outputDir: string) {
  return {
    json: path.join(outputDir, "search-test-results.json"),
    markdown: path.join(outputDir, "search-quality-report.md"),
  }
}

function writeOutputs(outputDir: string, json: string, markdown: string): void {
  fs.mkdirSync(outputDir, { recursive: true })
  const files = outputFiles(outputDir)
  fs.writeFileSync(files.json, json)
  fs.writeFileSync(files.markdown, markdown)
  console.log(`Wrote ${files.json}`)
  console.log(`Wrote ${files.markdown}`)
}

function checkOutputs(outputDir: string, json: string, markdown: string): void {
  const files = outputFiles(outputDir)
  const stale = [
    [files.json, json],
    [files.markdown, markdown],
  ].filter(([file, expected]) => !fs.existsSync(file) || fs.readFileSync(file, "utf8") !== expected)

  if (stale.length > 0) {
    throw new Error(`Search report artifacts are stale: ${stale.map(([file]) => file).join(", ")}`)
  }
  console.log("Search report artifacts are current.")
}

function printSummary(report: ReturnType<typeof buildSearchTestReport>, executionTimeMs: number): void {
  console.log(`Execution time: ${executionTimeMs}ms (console-only)`)
  console.log(
    `Golden set: ${(report.summary.goldenSet.passRate * 100).toFixed(1)}% (${report.summary.goldenSet.passed}/${report.summary.goldenSet.total})`
  )
  console.log(
    `Sampled coverage: ${(report.summary.sampledCoverage.resultRate * 100).toFixed(1)}% (${report.summary.sampledCoverage.withResults}/${report.summary.sampledCoverage.total})`
  )
  console.log(
    `Crisis detection: ${report.summary.crisisDetection.detectedCrisis}/${report.summary.crisisDetection.expectedCrisis}`
  )
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2))
  const testQueries = readTestQueries()
  const { report, executionTimeMs } = await runSearchEvaluation(testQueries)
  const { json, markdown } = await formatSearchTestReportArtifacts(report)

  if (options.mode === "check") {
    checkOutputs(options.outputDir, json, markdown)
  } else {
    writeOutputs(options.outputDir, json, markdown)
  }

  printSummary(report, executionTimeMs)
  if (report.summary.goldenSet.passRate < 0.7) {
    throw new Error("Search quality failed: golden-set pass rate is below 70%")
  }
  if (report.summary.goldenSet.passRate < 0.85) {
    console.warn("Search quality warning: golden-set pass rate is below 85%")
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
