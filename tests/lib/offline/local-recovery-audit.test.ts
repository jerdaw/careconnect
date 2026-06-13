import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildOfflineLocalRecoveryPlan, buildOfflineLocalRecoverySnapshot } from "@/lib/offline/local-recovery-audit"
import { PILOT_DRAFT_STORAGE_PREFIX } from "@/lib/offline/pilot-draft-cleanup"
import { getOfflineDB } from "@/lib/offline/db"
import { logger } from "@/lib/logger"

vi.mock("@/lib/offline/db", () => ({
  getOfflineDB: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}))

const mockDb = {
  count: vi.fn(),
  get: vi.fn(),
}

describe("offline local recovery audit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()

    mockDb.count.mockImplementation(async (storeName: string) => {
      if (storeName === "services") return 196
      if (storeName === "embeddings") return 196
      if (storeName === "pendingFeedback") return 2
      return 0
    })
    mockDb.get.mockImplementation(async (_storeName: string, key: string) => {
      if (key === "lastSync") return { id: "lastSync", value: "2026-03-08T15:00:00.000Z" }
      if (key === "version") return { id: "version", value: "export-v1" }
      return undefined
    })
    vi.mocked(getOfflineDB).mockResolvedValue(mockDb as never)
  })

  it("returns aggregate local recovery counts and metadata", async () => {
    localStorage.setItem(`${PILOT_DRAFT_STORAGE_PREFIX}contact`, "{}")
    localStorage.setItem("careconnect-high-contrast", "true")
    sessionStorage.setItem(`${PILOT_DRAFT_STORAGE_PREFIX}referral`, "{}")

    const snapshot = await buildOfflineLocalRecoverySnapshot(new Date("2026-03-08T16:00:00.000Z"))

    expect(snapshot).toEqual({
      available: true,
      counts: {
        embeddings: 196,
        pendingFeedback: 2,
        pilotDraftLocalStorage: 1,
        pilotDraftSessionStorage: 1,
        services: 196,
      },
      inspectedAt: "2026-03-08T16:00:00.000Z",
      metadata: {
        hasExportVersion: true,
        hasLastSync: true,
        lastSync: "2026-03-08T15:00:00.000Z",
        lastSyncStatus: "fresh",
      },
    })
  })

  it("marks old recovery metadata as stale", async () => {
    mockDb.get.mockImplementation(async (_storeName: string, key: string) => {
      if (key === "lastSync") return { id: "lastSync", value: "2026-03-07T15:00:00.000Z" }
      if (key === "version") return { id: "version", value: "export-v1" }
      return undefined
    })

    const snapshot = await buildOfflineLocalRecoverySnapshot(new Date("2026-03-08T16:00:00.000Z"))

    expect(snapshot.metadata.lastSyncStatus).toBe("stale")
  })

  it("marks invalid recovery metadata timestamps as unknown", async () => {
    mockDb.get.mockImplementation(async (_storeName: string, key: string) => {
      if (key === "lastSync") return { id: "lastSync", value: "not-a-date" }
      if (key === "version") return { id: "version", value: "export-v1" }
      return undefined
    })

    const snapshot = await buildOfflineLocalRecoverySnapshot(new Date("2026-03-08T16:00:00.000Z"))

    expect(snapshot.metadata).toMatchObject({
      hasLastSync: true,
      lastSync: "not-a-date",
      lastSyncStatus: "unknown",
    })
  })

  it("does not read queued payload contents", async () => {
    await buildOfflineLocalRecoverySnapshot(new Date("2026-03-08T16:00:00.000Z"))

    expect(mockDb.count).toHaveBeenCalledWith("services")
    expect(mockDb.count).toHaveBeenCalledWith("embeddings")
    expect(mockDb.count).toHaveBeenCalledWith("pendingFeedback")
    expect(mockDb.get).toHaveBeenCalledWith("meta", "lastSync")
    expect(mockDb.get).toHaveBeenCalledWith("meta", "version")
    expect(mockDb.get).not.toHaveBeenCalledWith("pendingFeedback")
  })

  it("returns a non-payload failure snapshot when IndexedDB is unavailable", async () => {
    vi.mocked(getOfflineDB).mockRejectedValue(new Error("contains internal details"))
    localStorage.setItem(`${PILOT_DRAFT_STORAGE_PREFIX}contact`, "{}")

    const snapshot = await buildOfflineLocalRecoverySnapshot(new Date("2026-03-08T16:00:00.000Z"))

    expect(snapshot.available).toBe(false)
    expect(snapshot.reason).toBe("offline_db_unavailable")
    expect(snapshot.counts).toEqual({
      embeddings: null,
      pendingFeedback: null,
      pilotDraftLocalStorage: 1,
      pilotDraftSessionStorage: 0,
      services: null,
    })
    expect(snapshot.metadata.lastSyncStatus).toBe("unknown")
    expect(JSON.stringify(snapshot)).not.toContain("contains internal details")
    expect(logger.warn).toHaveBeenCalledWith("Unable to build offline local recovery snapshot", {
      errorType: "Error",
      reason: "offline_db_unavailable",
    })
    expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain("contains internal details")
  })

  it("keeps recovery snapshots aggregate-only when draft storage cannot be inspected", async () => {
    const originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage")
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked local storage details")
      },
    })

    try {
      const snapshot = await buildOfflineLocalRecoverySnapshot(new Date("2026-03-08T16:00:00.000Z"))
      const plan = buildOfflineLocalRecoveryPlan(snapshot)

      expect(snapshot.available).toBe(true)
      expect(snapshot.counts.pilotDraftLocalStorage).toBeNull()
      expect(snapshot.counts.pilotDraftSessionStorage).toBe(0)
      expect(JSON.stringify(snapshot)).not.toContain("blocked local storage details")
      expect(plan.recommendations).toContainEqual({
        destructive: false,
        id: "inspect_browser_storage",
        priority: "high",
      })
      expect(logger.warn).toHaveBeenCalledWith("Unable to count pilot draft storage keys for recovery snapshot", {
        errorType: "Error",
        storage: "localStorage",
      })
      expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain("blocked local storage details")
    } finally {
      if (originalLocalStorage) {
        Object.defineProperty(window, "localStorage", originalLocalStorage)
      }
    }
  })

  it("recommends preserving queued writes before recovery actions", async () => {
    localStorage.setItem(`${PILOT_DRAFT_STORAGE_PREFIX}contact`, "{}")

    const snapshot = await buildOfflineLocalRecoverySnapshot(new Date("2026-03-08T16:00:00.000Z"))
    const plan = buildOfflineLocalRecoveryPlan(snapshot)

    expect(plan.hasQueuedLocalWrites).toBe(true)
    expect(plan.recommendations).toContainEqual({
      destructive: false,
      id: "preserve_queued_writes",
      priority: "high",
    })
  })

  it("recommends retrying sync when aggregate metadata is stale", async () => {
    mockDb.count.mockImplementation(async (storeName: string) => {
      if (storeName === "services") return 196
      if (storeName === "embeddings") return 196
      return 0
    })
    mockDb.get.mockImplementation(async (_storeName: string, key: string) => {
      if (key === "lastSync") return { id: "lastSync", value: "2026-03-07T15:00:00.000Z" }
      if (key === "version") return { id: "version", value: "export-v1" }
      return undefined
    })

    const snapshot = await buildOfflineLocalRecoverySnapshot(new Date("2026-03-08T16:00:00.000Z"))
    const plan = buildOfflineLocalRecoveryPlan(snapshot)

    expect(plan.hasQueuedLocalWrites).toBe(false)
    expect(plan.recommendations).toContainEqual({
      destructive: false,
      id: "retry_offline_sync",
      priority: "medium",
    })
  })

  it("recommends running recovery diagnostics in the browser for server snapshots", () => {
    const plan = buildOfflineLocalRecoveryPlan({
      available: false,
      counts: {
        embeddings: null,
        pendingFeedback: null,
        pilotDraftLocalStorage: null,
        pilotDraftSessionStorage: null,
        services: null,
      },
      inspectedAt: "2026-03-08T16:00:00.000Z",
      metadata: {
        hasExportVersion: false,
        hasLastSync: false,
        lastSync: null,
        lastSyncStatus: "unknown",
      },
      reason: "server",
    })

    expect(plan).toEqual({
      hasQueuedLocalWrites: false,
      recommendations: [
        {
          destructive: false,
          id: "run_in_browser",
          priority: "high",
        },
      ],
    })
  })

  it("returns a no-action recommendation for healthy aggregate snapshots", async () => {
    mockDb.count.mockImplementation(async (storeName: string) => {
      if (storeName === "services") return 196
      if (storeName === "embeddings") return 196
      return 0
    })

    const snapshot = await buildOfflineLocalRecoverySnapshot(new Date("2026-03-08T16:00:00.000Z"))
    const plan = buildOfflineLocalRecoveryPlan(snapshot)

    expect(plan).toEqual({
      hasQueuedLocalWrites: false,
      recommendations: [
        {
          destructive: false,
          id: "no_immediate_recovery_action",
          priority: "low",
        },
      ],
    })
  })
})
