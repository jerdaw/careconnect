/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest"
import {
  clearRetirementUserData,
  collectRetirementUserData,
  RETIREMENT_USER_STORAGE_KEYS,
} from "@/lib/retirement/user-authored-data"

describe("retirement user-authored local data", () => {
  it("exports saved searches and optional context without uploading or mutating them", async () => {
    const values = new Map<string, string>([
      ["careconnect_saved_searches", '["food"]'],
      ["careconnect_user_context", '{"ageGroup":"adult","identities":["newcomer"],"hasOptedIn":true}'],
    ])
    const getItem = vi.fn((key: string) => values.get(key) ?? null)

    const result = await collectRetirementUserData({
      localStorage: { getItem, removeItem: vi.fn() },
      now: () => new Date("2026-08-12T20:00:00Z"),
    })

    expect(result).toEqual({
      exportedAt: "2026-08-12T20:00:00.000Z",
      formatVersion: 1,
      localPreferences: {
        careconnect_saved_searches: ["food"],
        careconnect_user_context: { ageGroup: "adult", identities: ["newcomer"], hasOptedIn: true },
      },
      pendingFeedback: [],
    })
    expect(getItem).toHaveBeenCalledTimes(RETIREMENT_USER_STORAGE_KEYS.length)
  })

  it("clears user-authored localStorage only after the caller invokes the explicit action", async () => {
    const removeItem = vi.fn()

    const result = await clearRetirementUserData({
      localStorage: { getItem: vi.fn(), removeItem },
    })

    expect(removeItem.mock.calls.map(([key]) => key)).toEqual(RETIREMENT_USER_STORAGE_KEYS)
    expect(result).toEqual({
      pendingFeedbackDatabasesCleared: 0,
      storageKeysRemoved: RETIREMENT_USER_STORAGE_KEYS.length,
    })
  })
})
