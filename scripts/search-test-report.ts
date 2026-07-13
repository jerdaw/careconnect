export type SearchQueryQuality = "well" | "average" | "poor"

export interface GoldenQuery {
  id: string
  query: string
  quality: SearchQueryQuality
  category: string
  subCategory: string
  expectedServices: string[]
  mustIncludeAtLeastOne: string[]
  notes?: string
}

export interface SampledQuery {
  id: string
  query: string
  category: string
  subCategory: string
  expectedCategories: string[]
  notes?: string
}

export interface TestQueries {
  metadata: { evaluationAsOf: string }
  goldenSet: { queries: GoldenQuery[] }
  sampledCoverage: { queries: SampledQuery[] }
}

export interface ServiceResult {
  id: string
  name: string
  score: number
  matchReasons: string[]
  rank: number
}

export interface GoldenResult {
  id: string
  query: string
  quality: SearchQueryQuality
  category: string
  subCategory: string
  expectedServices: string[]
  mustIncludeAtLeastOne: string[]
  notes?: string
  crisisDetected: boolean
  totalResults: number
  top10: ServiceResult[]
  mustIncludeFound: boolean
  mustIncludeRank: number | null
  mustIncludeService: string | null
  expectedRecall: number
  expectedInTop10: string[]
  expectedMissing: string[]
  pass: boolean
}

export interface SampledResult {
  id: string
  query: string
  category: string
  subCategory: string
  expectedCategories: string[]
  notes?: string
  crisisDetected: boolean
  totalResults: number
  top5: ServiceResult[]
  hasResults: boolean
}

interface CountSummary {
  total: number
  passed: number
}

export interface SearchTestReport {
  metadata: {
    evaluationAsOf: string
    dataSource: "checked-in-local-services"
    totalQueries: number
    goldenSetCount: number
    sampledCoverageCount: number
  }
  summary: {
    goldenSet: {
      total: number
      passed: number
      failed: number
      passRate: number
      avgRecall: number
      byQuality: Record<SearchQueryQuality, CountSummary>
      byCategory: Record<string, CountSummary>
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
      detectionRate: number
    }
  }
  goldenResults: GoldenResult[]
  sampledResults: SampledResult[]
  failures: {
    goldenSet: GoldenResult[]
    noResults: SampledResult[]
  }
}

export interface BuildSearchTestReportInput {
  evaluationAsOf: string
  goldenResults: GoldenResult[]
  sampledResults: SampledResult[]
}

const QUALITY_LABELS: Record<SearchQueryQuality, string> = {
  well: "Well-worded",
  average: "Average",
  poor: "Poor",
}

const QUALITY_ORDER: SearchQueryQuality[] = ["well", "average", "poor"]

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

function isExpectedCrisis(result: GoldenResult | SampledResult): boolean {
  const category = result.category.toLowerCase()
  const subCategory = result.subCategory.toLowerCase()
  return category === "crisis" || subCategory.includes("suicide") || subCategory.includes("crisis")
}

export function buildSearchTestReport({
  evaluationAsOf,
  goldenResults,
  sampledResults,
}: BuildSearchTestReportInput): SearchTestReport {
  const goldenPassed = goldenResults.filter((result) => result.pass).length
  const byQuality = Object.fromEntries(
    QUALITY_ORDER.map((quality) => {
      const matchingResults = goldenResults.filter((result) => result.quality === quality)
      return [
        quality,
        {
          total: matchingResults.length,
          passed: matchingResults.filter((result) => result.pass).length,
        },
      ]
    })
  ) as Record<SearchQueryQuality, CountSummary>

  const categoryNames = [...new Set(goldenResults.map((result) => result.category))].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0
  )
  const byCategory = Object.fromEntries(
    categoryNames.map((category) => {
      const matchingResults = goldenResults.filter((result) => result.category === category)
      return [
        category,
        {
          total: matchingResults.length,
          passed: matchingResults.filter((result) => result.pass).length,
        },
      ]
    })
  )

  const sampledWithResults = sampledResults.filter((result) => result.hasResults).length
  const allResults = [...goldenResults, ...sampledResults]
  const expectedCrisis = allResults.filter(isExpectedCrisis).length
  const detectedCrisis = allResults.filter((result) => isExpectedCrisis(result) && result.crisisDetected).length

  return {
    metadata: {
      evaluationAsOf,
      dataSource: "checked-in-local-services",
      totalQueries: allResults.length,
      goldenSetCount: goldenResults.length,
      sampledCoverageCount: sampledResults.length,
    },
    summary: {
      goldenSet: {
        total: goldenResults.length,
        passed: goldenPassed,
        failed: goldenResults.length - goldenPassed,
        passRate: ratio(goldenPassed, goldenResults.length),
        avgRecall: ratio(
          goldenResults.reduce((sum, result) => sum + result.expectedRecall, 0),
          goldenResults.length
        ),
        byQuality,
        byCategory,
      },
      sampledCoverage: {
        total: sampledResults.length,
        withResults: sampledWithResults,
        noResults: sampledResults.length - sampledWithResults,
        resultRate: ratio(sampledWithResults, sampledResults.length),
      },
      crisisDetection: {
        expectedCrisis,
        detectedCrisis,
        detectionRate: expectedCrisis === 0 ? 1 : detectedCrisis / expectedCrisis,
      },
    },
    goldenResults,
    sampledResults,
    failures: {
      goldenSet: goldenResults.filter((result) => !result.pass),
      noResults: sampledResults.filter((result) => !result.hasResults),
    },
  }
}

export function serializeSearchTestReport(report: SearchTestReport): string {
  return `${JSON.stringify(report, null, 2)}\n`
}

export async function formatSearchTestReportArtifacts(
  report: SearchTestReport
): Promise<{ json: string; markdown: string }> {
  const projectRoot = path.join(__dirname, "..")
  const prettierConfig = (await resolveConfig(path.join(projectRoot, "package.json"))) ?? {}

  const [json, markdown] = await Promise.all([
    format(serializeSearchTestReport(report), {
      ...prettierConfig,
      filepath: path.join(projectRoot, "tests/fixtures/search-test-results.json"),
    }),
    format(renderSearchTestReportMarkdown(report), {
      ...prettierConfig,
      filepath: path.join(projectRoot, "tests/fixtures/search-quality-report.md"),
    }),
  ])

  return { json, markdown }
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function passRate({ total, passed }: CountSummary): string {
  return `${percent(ratio(passed, total))} (${passed}/${total})`
}

function markdownCell(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/[\r\n]+/g, " ")
}

export function renderSearchTestReportMarkdown(report: SearchTestReport): string {
  const { metadata, summary, failures } = report
  const lines = [
    "# Search Quality Report",
    "",
    `**Evaluation as of:** ${metadata.evaluationAsOf}`,
    `**Data source:** ${metadata.dataSource}`,
    `**Total queries:** ${metadata.totalQueries}`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Golden Set Pass Rate | ${percent(summary.goldenSet.passRate)} (${summary.goldenSet.passed}/${summary.goldenSet.total}) |`,
    `| Sampled Coverage Result Rate | ${percent(summary.sampledCoverage.resultRate)} (${summary.sampledCoverage.withResults}/${summary.sampledCoverage.total}) |`,
    `| Average Recall | ${percent(summary.goldenSet.avgRecall)} |`,
    `| Expected Crisis Detection Rate | ${percent(summary.crisisDetection.detectionRate)} (${summary.crisisDetection.detectedCrisis}/${summary.crisisDetection.expectedCrisis}) |`,
    "",
    "## Analysis by Query Quality",
    "",
    "| Quality Level | Pass Rate |",
    "| --- | ---: |",
    ...QUALITY_ORDER.map(
      (quality) => `| ${QUALITY_LABELS[quality]} | ${passRate(summary.goldenSet.byQuality[quality])} |`
    ),
    "",
    "## Analysis by Category",
    "",
    "| Category | Pass Rate |",
    "| --- | ---: |",
    ...Object.entries(summary.goldenSet.byCategory).map(
      ([category, counts]) => `| ${markdownCell(category)} | ${passRate(counts)} |`
    ),
    "",
    `## Golden Set Failures (${failures.goldenSet.length})`,
    "",
  ]

  if (failures.goldenSet.length === 0) {
    lines.push("None.")
  } else {
    lines.push("| ID | Query | Expected | Top 3 Results | Recall |", "| --- | --- | --- | --- | ---: |")
    for (const failure of failures.goldenSet) {
      const topResults = failure.top10
        .slice(0, 3)
        .map((result) => result.id)
        .join(", ")
      lines.push(
        `| ${markdownCell(failure.id)} | "${markdownCell(failure.query)}" | ${markdownCell(failure.mustIncludeAtLeastOne.join(" OR "))} | ${markdownCell(topResults || "No results")} | ${percent(failure.expectedRecall)} |`
      )
    }
  }

  lines.push("", `## Queries With No Results (${failures.noResults.length})`, "")
  if (failures.noResults.length === 0) {
    lines.push("None.")
  } else {
    lines.push("| ID | Query |", "| --- | --- |")
    for (const failure of failures.noResults) {
      lines.push(`| ${markdownCell(failure.id)} | "${markdownCell(failure.query)}" |`)
    }
  }

  return `${lines.join("\n")}\n`
}
import path from "path"
import { format, resolveConfig } from "prettier"
