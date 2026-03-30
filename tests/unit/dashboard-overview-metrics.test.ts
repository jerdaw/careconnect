/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { buildDashboardOverviewMetrics } from "@/lib/dashboard/overview-metrics"

const NOW = new Date("2026-03-29T12:00:00.000Z")

describe("buildDashboardOverviewMetrics", () => {
  it("aggregates current and previous 30-day analytics windows", () => {
    const metrics = buildDashboardOverviewMetrics(
      [
        { verification_status: "L3", last_verified: "2026-03-25T00:00:00.000Z" },
        { verification_status: "L2", last_verified: "2026-02-20T00:00:00.000Z" },
        { verification_status: "L1", last_verified: "2025-12-01T00:00:00.000Z" },
        { verification_status: "L2", last_verified: null },
        { verification_status: "L0", last_verified: "2026-03-24T00:00:00.000Z" },
      ],
      [
        { event_type: "view_detail", created_at: "2026-03-20T00:00:00.000Z" },
        { event_type: "view_detail", created_at: "2026-03-18T00:00:00.000Z" },
        { event_type: "view_detail", created_at: "2026-03-05T00:00:00.000Z" },
        { event_type: "view_detail", created_at: "2026-02-15T00:00:00.000Z" },
        { event_type: "click_call", created_at: "2026-03-10T00:00:00.000Z" },
        { event_type: "click_website", created_at: "2026-03-09T00:00:00.000Z" },
        { event_type: "click_call", created_at: "2026-02-20T00:00:00.000Z" },
      ],
      4,
      NOW
    )

    expect(metrics.totalViews).toEqual({
      current: 3,
      previous: 1,
      change: 200,
    })
    expect(metrics.referrals).toEqual({
      current: 2,
      previous: 1,
      change: 100,
    })
    expect(metrics.servicesUpToDate).toEqual({
      current: 2,
      total: 5,
    })
    expect(metrics.servicesNeedingVerification).toBe(3)
    expect(metrics.pendingUpdates).toBe(4)
    expect(metrics.dataQualityAvailable).toBe(false)
  })

  it("handles zero-event windows and zero-division deltas safely", () => {
    const metrics = buildDashboardOverviewMetrics(
      [],
      [{ event_type: "click_call", created_at: "2026-03-28T00:00:00.000Z" }],
      0,
      NOW
    )

    expect(metrics.totalViews).toEqual({
      current: 0,
      previous: 0,
      change: 0,
    })
    expect(metrics.referrals).toEqual({
      current: 1,
      previous: 0,
      change: 100,
    })
    expect(metrics.servicesUpToDate).toEqual({
      current: 0,
      total: 0,
    })
    expect(metrics.servicesNeedingVerification).toBe(0)
  })
})
