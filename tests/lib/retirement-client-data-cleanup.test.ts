/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest"
import {
  clearRetiredClientData,
  isRetirementCacheName,
  RETIREMENT_SERVICE_STORAGE_KEYS,
} from "@/lib/retirement/client-data-cleanup"

describe("retirement client data cleanup", () => {
  it("recognizes every directory-owned cache family without matching unrelated caches", () => {
    for (const cacheName of [
      "services-api",
      "services-export-v2",
      "start-url",
      "offline-fallback",
      "pwa-assets",
      "next-static-build",
      "next-image",
      "workbox-precache-v2-origin",
    ]) {
      expect(isRetirementCacheName(cacheName)).toBe(true)
    }
    expect(isRetirementCacheName("unrelated-cache")).toBe(false)
  })

  it("clears directory caches and storage, then unregisters existing workers", async () => {
    const deletedCaches: string[] = []
    const removedStorageKeys: string[] = []
    const unregisterFirst = vi.fn().mockResolvedValue(true)
    const unregisterSecond = vi.fn().mockResolvedValue(false)

    const result = await clearRetiredClientData({
      cacheStorage: {
        keys: vi.fn().mockResolvedValue(["services-api", "workbox-precache-v2-origin", "unrelated-cache"]),
        delete: vi.fn(async (cacheName: string) => {
          deletedCaches.push(cacheName)
          return true
        }),
      },
      localStorage: {
        removeItem: vi.fn((key: string) => removedStorageKeys.push(key)),
      },
      serviceWorkerRegistrations: vi
        .fn()
        .mockResolvedValue([{ unregister: unregisterFirst }, { unregister: unregisterSecond }]),
    })

    expect(deletedCaches).toEqual(["services-api", "workbox-precache-v2-origin"])
    expect(removedStorageKeys).toEqual(RETIREMENT_SERVICE_STORAGE_KEYS)
    expect(unregisterFirst).toHaveBeenCalledOnce()
    expect(unregisterSecond).toHaveBeenCalledOnce()
    expect(result).toEqual({
      cachesDeleted: 2,
      offlineDatabasesCleared: 0,
      serviceWorkersUnregistered: 1,
      storageKeysRemoved: 3,
      vectorDatabasesDeleted: 0,
    })
  })
})
