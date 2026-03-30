import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockLogger = {
  warn: vi.fn(),
  error: vi.fn(),
}

async function loadPushManager(vapidKey?: string) {
  vi.resetModules()
  if (vapidKey) {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", vapidKey)
  } else {
    vi.unstubAllEnvs()
  }

  vi.doMock("@/lib/logger", () => ({
    logger: mockLogger,
  }))

  return import("@/lib/notifications/push-manager")
}

describe("PushNotificationManager", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("returns false when PushManager is unavailable", async () => {
    delete (window as Window & { PushManager?: unknown }).PushManager
    const { PushNotificationManager } = await loadPushManager("test-vapid-key")
    const manager = new PushNotificationManager()

    const result = await manager.init()

    expect(result).toBe(false)
    expect(mockLogger.warn).toHaveBeenCalledWith("PushManager not supported", {
      component: "PushNotificationManager",
    })
  })

  it("returns null when the VAPID key is missing", async () => {
    ;(window as Window & { PushManager?: unknown }).PushManager = function PushManager() {}
    const { PushNotificationManager } = await loadPushManager()
    const manager = new PushNotificationManager()

    const result = await manager.subscribe(["general"])

    expect(result).toBeNull()
    expect(mockLogger.error).toHaveBeenCalledWith("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY")
  })

  it("subscribes and posts the browser subscription to the API", async () => {
    ;(window as Window & { PushManager?: unknown }).PushManager = function PushManager() {}
    Object.defineProperty(window, "atob", {
      value: vi.fn(() => "decoded-key"),
      writable: true,
    })

    const browserSubscription = {
      endpoint: "https://push.example/subscription",
      toJSON: vi.fn(() => ({
        endpoint: "https://push.example/subscription",
        keys: { p256dh: "key", auth: "secret" },
      })),
    }

    const registration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(browserSubscription),
      },
    }

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve(registration),
      },
      configurable: true,
    })

    Object.defineProperty(document.documentElement, "lang", {
      value: "fr",
      configurable: true,
    })

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: "subscription-1" }),
    } as unknown as Response)

    const { PushNotificationManager } = await loadPushManager("test-vapid-key")
    const manager = new PushNotificationManager()

    const result = await manager.subscribe(["general"])

    expect(result).toEqual({ id: "subscription-1" })
    expect(registration.pushManager.subscribe).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/notifications/subscribe",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"locale":"fr"'),
      })
    )
  })
})
