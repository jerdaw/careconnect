/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { check as checkFormatting, resolveConfig } from "prettier"

import {
  buildSearchTestReport,
  formatSearchTestReportArtifacts,
  renderSearchTestReportMarkdown,
  serializeSearchTestReport,
  type GoldenResult,
  type SampledResult,
} from "@/scripts/search-test-report"

function goldenResult(
  overrides: Partial<GoldenResult> & Pick<GoldenResult, "id" | "quality" | "category">
): GoldenResult {
  const { id, quality, category, ...rest } = overrides
  return {
    id,
    query: `query for ${id}`,
    quality,
    category,
    subCategory: "fixture",
    expectedServices: ["expected-service"],
    mustIncludeAtLeastOne: ["expected-service"],
    crisisDetected: false,
    totalResults: 1,
    top10: [
      {
        id: "expected-service",
        name: "Expected Service",
        score: 42,
        matchReasons: ["fixture"],
        rank: 1,
      },
    ],
    mustIncludeFound: true,
    mustIncludeRank: 1,
    mustIncludeService: "expected-service",
    expectedRecall: 1,
    expectedInTop10: ["expected-service"],
    expectedMissing: [],
    pass: true,
    ...rest,
  }
}

function sampledResult(overrides: Partial<SampledResult> & Pick<SampledResult, "id">): SampledResult {
  const { id, ...rest } = overrides
  return {
    id,
    query: `query for ${id}`,
    category: "housing",
    subCategory: "fixture",
    expectedCategories: ["housing"],
    crisisDetected: false,
    totalResults: 1,
    top5: [
      {
        id: "sample-result",
        name: "Sample Result",
        score: 24,
        matchReasons: ["fixture"],
        rank: 1,
      },
    ],
    hasResults: true,
    ...rest,
  }
}

describe("search test report", () => {
  it("derives summary groups and failures from synthetic results", () => {
    const failedGolden = goldenResult({
      id: "golden-failed",
      quality: "average",
      category: "Food/Nutrition",
      expectedRecall: 0,
      expectedInTop10: [],
      expectedMissing: ["expected-service"],
      mustIncludeFound: false,
      mustIncludeRank: null,
      mustIncludeService: null,
      pass: false,
      top10: [],
      totalResults: 0,
    })
    const noResults = sampledResult({
      id: "sample-no-results",
      totalResults: 0,
      top5: [],
      hasResults: false,
    })

    const report = buildSearchTestReport({
      evaluationAsOf: "2026-06-30T12:00:00.000Z",
      goldenResults: [
        goldenResult({ id: "golden-well", quality: "well", category: "Crisis", crisisDetected: true }),
        failedGolden,
      ],
      sampledResults: [sampledResult({ id: "sample-result" }), noResults],
    })

    expect(report.metadata).toEqual({
      evaluationAsOf: "2026-06-30T12:00:00.000Z",
      dataSource: "checked-in-local-services",
      totalQueries: 4,
      goldenSetCount: 2,
      sampledCoverageCount: 2,
    })
    expect(report.summary).toEqual({
      goldenSet: {
        total: 2,
        passed: 1,
        failed: 1,
        passRate: 0.5,
        avgRecall: 0.5,
        byQuality: {
          well: { total: 1, passed: 1 },
          average: { total: 1, passed: 0 },
          poor: { total: 0, passed: 0 },
        },
        byCategory: {
          Crisis: { total: 1, passed: 1 },
          "Food/Nutrition": { total: 1, passed: 0 },
        },
      },
      sampledCoverage: {
        total: 2,
        withResults: 1,
        noResults: 1,
        resultRate: 0.5,
      },
      crisisDetection: {
        expectedCrisis: 1,
        detectedCrisis: 1,
        detectionRate: 1,
      },
    })
    expect(report.failures).toEqual({ goldenSet: [failedGolden], noResults: [noResults] })

    const markdown = renderSearchTestReportMarkdown(report)
    expect(markdown).toContain("Golden Set Pass Rate | 50.0% (1/2)")
    expect(markdown).toContain("| Well-worded | 100.0% (1/1) |")
    expect(markdown).toContain("| Food/Nutrition | 0.0% (0/1) |")
    expect(markdown).toContain('| golden-failed | "query for golden-failed" | expected-service | No results | 0.0% |')
    expect(markdown).toContain('| sample-no-results | "query for sample-no-results" |')
  })

  it("serializes the same report to identical bytes without runtime metadata", () => {
    const report = buildSearchTestReport({
      evaluationAsOf: "2026-06-30T12:00:00.000Z",
      goldenResults: [goldenResult({ id: "stable", quality: "poor", category: "Legal" })],
      sampledResults: [],
    })

    const first = serializeSearchTestReport(report)
    const second = serializeSearchTestReport(report)

    expect(Buffer.from(first).equals(Buffer.from(second))).toBe(true)
    expect(first).toContain('"evaluationAsOf": "2026-06-30T12:00:00.000Z"')
    expect(first).toContain('"dataSource": "checked-in-local-services"')
    expect(first).not.toContain("runAt")
    expect(first).not.toContain("executionTimeMs")
  })

  it("counts only true positives in the expected-crisis detection rate", () => {
    const report = buildSearchTestReport({
      evaluationAsOf: "2026-06-30T12:00:00.000Z",
      goldenResults: [
        goldenResult({ id: "expected-crisis", quality: "well", category: "crisis", crisisDetected: true }),
      ],
      sampledResults: [sampledResult({ id: "false-positive", crisisDetected: true })],
    })

    expect(report.summary.crisisDetection).toEqual({
      expectedCrisis: 1,
      detectedCrisis: 1,
      detectionRate: 1,
    })
  })

  it("formats generated artifacts according to the repository Prettier contract", async () => {
    const report = buildSearchTestReport({
      evaluationAsOf: "2026-06-30T12:00:00.000Z",
      goldenResults: [goldenResult({ id: "formatted", quality: "well", category: "Housing" })],
      sampledResults: [sampledResult({ id: "formatted-sample" })],
    })

    const first = await formatSearchTestReportArtifacts(report)
    const second = await formatSearchTestReportArtifacts(report)
    const prettierConfig = (await resolveConfig(process.cwd())) ?? {}

    expect(first).toEqual(second)
    expect(await checkFormatting(first.json, { ...prettierConfig, filepath: "search-test-results.json" })).toBe(true)
    expect(await checkFormatting(first.markdown, { ...prettierConfig, filepath: "search-quality-report.md" })).toBe(
      true
    )
  })
})
