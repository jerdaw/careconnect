/**
 * Tests for SLO Tracker
 *
 * Validates uptime tracking, error budget calculations, and compliance checks.
 */

import { describe, it, expect, beforeEach } from "vitest"
import {
  recordUptimeEvent,
  calculateUptimePercentage,
  calculateErrorBudgetRemaining,
  checkLatencySLO,
  getSLOComplianceSummary,
  clearUptimeHistory,
  getUptimeHistory,
} from "@/lib/observability/slo-tracker"
import { SLO_TARGETS } from "@/lib/config/slo-targets"

describe("SLO Tracker", () => {
  beforeEach(() => {
    // Clear history before each test
    clearUptimeHistory()
  })

  describe("recordUptimeEvent", () => {
    it("should record successful uptime events", () => {
      recordUptimeEvent(true)
      recordUptimeEvent(true)
      recordUptimeEvent(true)

      const history = getUptimeHistory()
      expect(history).toHaveLength(3)
      expect(history.every((dp) => dp.success)).toBe(true)
    })

    it("should record failed uptime events", () => {
      recordUptimeEvent(false)
      recordUptimeEvent(false)

      const history = getUptimeHistory()
      expect(history).toHaveLength(2)
      expect(history.every((dp) => dp.success)).toBe(false)
    })

    it("should record mixed uptime events", () => {
      recordUptimeEvent(true)
      recordUptimeEvent(false)
      recordUptimeEvent(true)

      const history = getUptimeHistory()
      expect(history).toHaveLength(3)
      expect(history[0]!.success).toBe(true)
      expect(history[1]!.success).toBe(false)
      expect(history[2]!.success).toBe(true)
    })

    it("should include timestamps in events", () => {
      const beforeTime = Date.now()
      recordUptimeEvent(true)
      const afterTime = Date.now()

      const history = getUptimeHistory()
      expect(history[0]!.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(history[0]!.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe("calculateUptimePercentage", () => {
    it("should return null when no data", () => {
      const uptime = calculateUptimePercentage()
      expect(uptime).toBeNull()
    })

    it("should calculate 100% uptime", () => {
      recordUptimeEvent(true)
      recordUptimeEvent(true)
      recordUptimeEvent(true)

      const uptime = calculateUptimePercentage()
      expect(uptime).toBe(1.0)
    })

    it("should calculate 0% uptime", () => {
      recordUptimeEvent(false)
      recordUptimeEvent(false)
      recordUptimeEvent(false)

      const uptime = calculateUptimePercentage()
      expect(uptime).toBe(0.0)
    })

    it("should calculate 99.5% uptime", () => {
      // Record 199 successes and 1 failure = 99.5%
      for (let i = 0; i < 199; i++) {
        recordUptimeEvent(true)
      }
      recordUptimeEvent(false)

      const uptime = calculateUptimePercentage()
      expect(uptime).toBe(0.995)
    })

    it("should calculate 50% uptime", () => {
      recordUptimeEvent(true)
      recordUptimeEvent(false)
      recordUptimeEvent(true)
      recordUptimeEvent(false)

      const uptime = calculateUptimePercentage()
      expect(uptime).toBe(0.5)
    })

    it("should calculate uptime with various ratios", () => {
      // 3 successes, 1 failure = 75%
      recordUptimeEvent(true)
      recordUptimeEvent(true)
      recordUptimeEvent(true)
      recordUptimeEvent(false)

      const uptime = calculateUptimePercentage()
      expect(uptime).toBe(0.75)
    })
  })

  describe("calculateErrorBudgetRemaining", () => {
    it("should return null when no data", () => {
      const budget = calculateErrorBudgetRemaining()
      expect(budget).toBeNull()
    })

    it("should return 100% budget when uptime is 100%", () => {
      recordUptimeEvent(true)
      recordUptimeEvent(true)
      recordUptimeEvent(true)

      const budget = calculateErrorBudgetRemaining()
      expect(budget).toBe(1.0)
    })

    it("should return 0% budget when uptime equals target", () => {
      // SLO target is 99.5%, so 99.5% uptime = 0% budget remaining
      // Record 199 successes and 1 failure = 99.5% uptime
      for (let i = 0; i < 199; i++) {
        recordUptimeEvent(true)
      }
      recordUptimeEvent(false)

      const budget = calculateErrorBudgetRemaining()
      expect(budget).toBeCloseTo(0.0, 1)
    })

    it("should return negative budget (clamped to 0) when uptime below target", () => {
      // Record 50% uptime (well below 99.5% target)
      recordUptimeEvent(true)
      recordUptimeEvent(false)

      const budget = calculateErrorBudgetRemaining()
      expect(budget).toBe(0.0) // Should be clamped to 0
    })

    it("should calculate partial budget consumption", () => {
      // Record 100% uptime = 100% budget remaining
      for (let i = 0; i < 100; i++) {
        recordUptimeEvent(true)
      }

      const budget = calculateErrorBudgetRemaining()
      expect(budget).toBe(1.0)
    })

    it("should handle budget at warning threshold (50%)", () => {
      // Calculate uptime that consumes 50% of error budget
      // Error budget = 0.5% (0.005)
      // Target uptime = 99.5% (0.995)
      // To consume 50% budget: actual error rate = 0.25% (0.0025)
      // Actual uptime = 99.75% (0.9975)

      // 400 checks: 399 success, 1 failure = 99.75% uptime
      for (let i = 0; i < 399; i++) {
        recordUptimeEvent(true)
      }
      recordUptimeEvent(false)

      const budget = calculateErrorBudgetRemaining()
      expect(budget).toBeCloseTo(0.5, 1) // ~50% remaining
    })
  })

  describe("checkLatencySLO", () => {
    it("should return compliant when no data", () => {
      const result = checkLatencySLO()

      expect(result.compliant).toBe(true)
      expect(result.hasData).toBe(false)
      expect(result.actualP95).toBeNull()
      expect(result.target).toBe(SLO_TARGETS.latencyP95Ms)
    })

    it("should return compliant when latency below target", () => {
      const result = checkLatencySLO(500) // 500ms < 800ms target

      expect(result.compliant).toBe(true)
      expect(result.hasData).toBe(true)
      expect(result.actualP95).toBe(500)
      expect(result.target).toBe(800)
    })

    it("should return compliant when latency at target", () => {
      const result = checkLatencySLO(800) // 800ms = 800ms target

      expect(result.compliant).toBe(true)
      expect(result.hasData).toBe(true)
      expect(result.actualP95).toBe(800)
    })

    it("should return non-compliant when latency exceeds target", () => {
      const result = checkLatencySLO(1000) // 1000ms > 800ms target

      expect(result.compliant).toBe(false)
      expect(result.hasData).toBe(true)
      expect(result.actualP95).toBe(1000)
    })

    it("should handle edge case of 0ms latency", () => {
      const result = checkLatencySLO(0)

      expect(result.compliant).toBe(true)
      expect(result.actualP95).toBe(0)
    })
  })

  describe("getSLOComplianceSummary", () => {
    it("should return compliant summary with no data", () => {
      const summary = getSLOComplianceSummary()

      expect(summary.uptime.compliant).toBe(true)
      expect(summary.uptime.totalChecks).toBe(0)
      expect(summary.errorBudget.remaining).toBe(1.0)
      expect(summary.errorBudget.exhausted).toBe(false)
      expect(summary.latency.compliant).toBe(true)
      expect(summary.latency.hasData).toBe(false)
      expect(summary.overall.compliant).toBe(true)
      expect(summary.overall.violations).toHaveLength(0)
    })

    it("should return compliant summary with perfect uptime", () => {
      recordUptimeEvent(true)
      recordUptimeEvent(true)
      recordUptimeEvent(true)

      const summary = getSLOComplianceSummary()

      expect(summary.uptime.compliant).toBe(true)
      expect(summary.uptime.actual).toBe(1.0)
      expect(summary.uptime.totalChecks).toBe(3)
      expect(summary.uptime.successfulChecks).toBe(3)
      expect(summary.errorBudget.remaining).toBe(1.0)
      expect(summary.overall.compliant).toBe(true)
    })

    it("should detect uptime violation", () => {
      // Record 50% uptime (well below 99.5% target)
      recordUptimeEvent(true)
      recordUptimeEvent(false)

      const summary = getSLOComplianceSummary()

      expect(summary.uptime.compliant).toBe(false)
      expect(summary.uptime.actual).toBe(0.5)
      expect(summary.overall.compliant).toBe(false)
      expect(summary.overall.violations).toContain("Uptime below target")
    })

    it("should detect error budget exhaustion", () => {
      // Record 0% uptime = error budget exhausted
      recordUptimeEvent(false)
      recordUptimeEvent(false)

      const summary = getSLOComplianceSummary()

      expect(summary.errorBudget.exhausted).toBe(true)
      expect(summary.errorBudget.remaining).toBe(0.0)
      expect(summary.overall.compliant).toBe(false)
      expect(summary.overall.violations).toContain("Error budget exhausted")
    })

    it("should detect latency violation", () => {
      recordUptimeEvent(true) // Need some uptime data

      // Manually check latency with violation
      const latencyResult = checkLatencySLO(1000) // 1000ms > 800ms
      expect(latencyResult.compliant).toBe(false)
    })

    it("should detect multiple violations", () => {
      // Record 0% uptime (violates both uptime and error budget)
      recordUptimeEvent(false)

      const summary = getSLOComplianceSummary()

      expect(summary.uptime.compliant).toBe(false)
      expect(summary.errorBudget.exhausted).toBe(true)
      expect(summary.overall.compliant).toBe(false)
      expect(summary.overall.violations.length).toBeGreaterThan(0)
    })

    it("should calculate warning threshold correctly", () => {
      const summary = getSLOComplianceSummary()

      expect(summary.errorBudget.warningThreshold).toBe(0.5) // 50%
    })

    it("should track total and successful checks", () => {
      recordUptimeEvent(true)
      recordUptimeEvent(false)
      recordUptimeEvent(true)
      recordUptimeEvent(true)

      const summary = getSLOComplianceSummary()

      expect(summary.uptime.totalChecks).toBe(4)
      expect(summary.uptime.successfulChecks).toBe(3)
      expect(summary.uptime.actual).toBe(0.75)
    })

    it("should return correct target values", () => {
      const summary = getSLOComplianceSummary()

      expect(summary.uptime.target).toBe(SLO_TARGETS.uptime)
      expect(summary.latency.target).toBe(SLO_TARGETS.latencyP95Ms)
    })
  })

  describe("clearUptimeHistory", () => {
    it("should clear all uptime history", () => {
      recordUptimeEvent(true)
      recordUptimeEvent(true)
      recordUptimeEvent(false)

      expect(getUptimeHistory()).toHaveLength(3)

      clearUptimeHistory()

      expect(getUptimeHistory()).toHaveLength(0)
    })

    it("should allow recording after clearing", () => {
      recordUptimeEvent(true)
      clearUptimeHistory()
      recordUptimeEvent(false)

      const history = getUptimeHistory()
      expect(history).toHaveLength(1)
      expect(history[0]!.success).toBe(false)
    })
  })

  describe("Edge Cases", () => {
    it("should handle single data point", () => {
      recordUptimeEvent(true)

      const uptime = calculateUptimePercentage()
      expect(uptime).toBe(1.0)

      const budget = calculateErrorBudgetRemaining()
      expect(budget).toBe(1.0)
    })

    it("should handle large number of events", () => {
      // Record 1000 events
      for (let i = 0; i < 1000; i++) {
        recordUptimeEvent(i % 100 !== 0) // 99% uptime
      }

      const uptime = calculateUptimePercentage()
      expect(uptime).toBeCloseTo(0.99, 2)

      const summary = getSLOComplianceSummary()
      expect(summary.uptime.totalChecks).toBe(1000)
    })

    it("should handle alternating success/failure pattern", () => {
      for (let i = 0; i < 100; i++) {
        recordUptimeEvent(i % 2 === 0)
      }

      const uptime = calculateUptimePercentage()
      expect(uptime).toBe(0.5)
    })
  })

  describe("Integration", () => {
    it("should maintain consistency between uptime and error budget", () => {
      // Record 99.5% uptime (at SLO target)
      for (let i = 0; i < 199; i++) {
        recordUptimeEvent(true)
      }
      recordUptimeEvent(false)

      const uptime = calculateUptimePercentage()
      const budget = calculateErrorBudgetRemaining()

      expect(uptime).toBe(0.995)
      expect(budget).toBeCloseTo(0.0, 1) // Budget should be exhausted at target
    })

    it("should reflect uptime changes in summary", () => {
      recordUptimeEvent(true)
      let summary = getSLOComplianceSummary()
      expect(summary.uptime.compliant).toBe(true)

      // Add failures to drop below target
      for (let i = 0; i < 100; i++) {
        recordUptimeEvent(false)
      }

      summary = getSLOComplianceSummary()
      expect(summary.uptime.compliant).toBe(false)
      expect(summary.overall.compliant).toBe(false)
    })
  })
})
