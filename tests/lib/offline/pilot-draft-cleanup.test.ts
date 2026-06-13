import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  clearPilotDraftStorage,
  clearPilotDraftStorageOnSignOut,
  isPilotDraftExpired,
  PILOT_DRAFT_MAX_AGE_MS,
  PILOT_DRAFT_SCHEMA_VERSION,
  PILOT_DRAFT_STORAGE_PREFIX,
  pruneExpiredPilotDraftStorage,
} from "@/lib/offline/pilot-draft-cleanup"
import { logger } from "@/lib/logger"

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}))

describe("pilot draft cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    localStorage.clear()
    sessionStorage.clear()
  })

  it("uses the max-age policy to identify expired drafts", () => {
    const now = Date.parse("2026-03-08T16:00:00.000Z")
    const fresh = new Date(now - PILOT_DRAFT_MAX_AGE_MS + 1).toISOString()
    const expired = new Date(now - PILOT_DRAFT_MAX_AGE_MS - 1).toISOString()

    expect(isPilotDraftExpired(fresh, now)).toBe(false)
    expect(isPilotDraftExpired(expired, now)).toBe(true)
    expect(isPilotDraftExpired("not-a-date", now)).toBe(true)
  })

  it("clears only reserved pilot draft keys", () => {
    localStorage.setItem(`${PILOT_DRAFT_STORAGE_PREFIX}contact-attempt`, "{}")
    localStorage.setItem("careconnect-high-contrast", "true")

    expect(clearPilotDraftStorage(localStorage)).toEqual([`${PILOT_DRAFT_STORAGE_PREFIX}contact-attempt`])
    expect(localStorage.getItem(`${PILOT_DRAFT_STORAGE_PREFIX}contact-attempt`)).toBeNull()
    expect(localStorage.getItem("careconnect-high-contrast")).toBe("true")
  })

  it("prunes expired, malformed, and unknown-version draft envelopes", () => {
    const now = Date.parse("2026-03-08T16:00:00.000Z")
    const freshKey = `${PILOT_DRAFT_STORAGE_PREFIX}fresh`
    const expiredKey = `${PILOT_DRAFT_STORAGE_PREFIX}expired`
    const malformedKey = `${PILOT_DRAFT_STORAGE_PREFIX}malformed`
    const unknownVersionKey = `${PILOT_DRAFT_STORAGE_PREFIX}unknown-version`

    localStorage.setItem(
      freshKey,
      JSON.stringify({
        createdAt: new Date(now - 60_000).toISOString(),
        payload: { event: "contact_attempt" },
        schemaVersion: PILOT_DRAFT_SCHEMA_VERSION,
      })
    )
    localStorage.setItem(
      expiredKey,
      JSON.stringify({
        createdAt: new Date(now - PILOT_DRAFT_MAX_AGE_MS - 1).toISOString(),
        payload: { event: "contact_attempt" },
        schemaVersion: PILOT_DRAFT_SCHEMA_VERSION,
      })
    )
    localStorage.setItem(malformedKey, "{")
    localStorage.setItem(
      unknownVersionKey,
      JSON.stringify({
        createdAt: new Date(now).toISOString(),
        payload: { event: "contact_attempt" },
        schemaVersion: 999,
      })
    )

    const removed = pruneExpiredPilotDraftStorage(localStorage, now)

    expect(removed).toEqual(expect.arrayContaining([expiredKey, malformedKey, unknownVersionKey]))
    expect(localStorage.getItem(freshKey)).not.toBeNull()
    expect(localStorage.getItem(expiredKey)).toBeNull()
    expect(localStorage.getItem(malformedKey)).toBeNull()
    expect(localStorage.getItem(unknownVersionKey)).toBeNull()
  })

  it("clears reserved pilot draft keys from local and session storage on sign-out", async () => {
    const localKey = `${PILOT_DRAFT_STORAGE_PREFIX}local-contact`
    const sessionKey = `${PILOT_DRAFT_STORAGE_PREFIX}session-contact`

    localStorage.setItem(localKey, "{}")
    sessionStorage.setItem(sessionKey, "{}")
    localStorage.setItem("careconnect-services-cache", "keep")

    const removed = await clearPilotDraftStorageOnSignOut()

    expect(removed).toEqual(expect.arrayContaining([localKey, sessionKey]))
    expect(localStorage.getItem(localKey)).toBeNull()
    expect(sessionStorage.getItem(sessionKey)).toBeNull()
    expect(localStorage.getItem("careconnect-services-cache")).toBe("keep")
  })

  it("continues sign-out cleanup when one draft storage area cannot be inspected", async () => {
    const originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage")
    const sessionKey = `${PILOT_DRAFT_STORAGE_PREFIX}session-contact`

    sessionStorage.setItem(sessionKey, "{}")
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked draft storage payload")
      },
    })

    try {
      const removed = await clearPilotDraftStorageOnSignOut()

      expect(removed).toEqual([sessionKey])
      expect(sessionStorage.getItem(sessionKey)).toBeNull()
      expect(logger.warn).toHaveBeenCalledWith("Unable to clear pilot draft storage during sign-out", {
        errorType: "Error",
        storage: "localStorage",
      })
      expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain("blocked draft storage payload")
    } finally {
      if (originalLocalStorage) {
        Object.defineProperty(window, "localStorage", originalLocalStorage)
      }
    }
  })
})
