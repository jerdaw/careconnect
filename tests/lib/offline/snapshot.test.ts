import { describe, expect, it, vi } from "vitest"
import {
  OFFLINE_SNAPSHOT_STALE_MS,
  formatOfflineSnapshotAge,
  formatOfflineSnapshotTimestamp,
  getOfflineSnapshotStatus,
} from "@/lib/offline/snapshot"

describe("offline snapshot helpers", () => {
  it("marks snapshots newer than 24 hours as fresh", () => {
    const now = Date.parse("2026-04-04T12:00:00.000Z")
    const lastSync = new Date(now - (OFFLINE_SNAPSHOT_STALE_MS - 60_000)).toISOString()

    expect(getOfflineSnapshotStatus(lastSync, now)).toBe("fresh")
  })

  it("marks snapshots older than 24 hours as stale", () => {
    const now = Date.parse("2026-04-04T12:00:00.000Z")
    const lastSync = new Date(now - (OFFLINE_SNAPSHOT_STALE_MS + 60_000)).toISOString()

    expect(getOfflineSnapshotStatus(lastSync, now)).toBe("stale")
  })

  it("returns unknown for missing or invalid timestamps", () => {
    expect(getOfflineSnapshotStatus()).toBe("unknown")
    expect(getOfflineSnapshotStatus("not-a-date")).toBe("unknown")
  })

  it("formats relative age in the active locale", () => {
    const now = Date.parse("2026-04-04T12:00:00.000Z")
    const lastSync = new Date("2026-04-04T09:00:00.000Z").toISOString()

    expect(formatOfflineSnapshotAge(lastSync, "en", now)).toBe("3 hours ago")
  })

  it("formats an absolute timestamp for display", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-04T12:00:00.000Z"))

    const formatted = formatOfflineSnapshotTimestamp("2026-04-03T16:30:00.000Z", "en")
    expect(formatted).toContain("2026")

    vi.useRealTimers()
  })
})
