/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { fetch211Services } from "@/lib/external/211-client"
import { IntentCategory, VerificationLevel } from "@/types/service"
import { assert211SyncEnabled } from "@/scripts/sync-211"

const originalEnv = { ...process.env }

describe("211 sync quarantine", () => {
  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("requires explicit manual opt-in before sync can run", () => {
    expect(() => assert211SyncEnabled({ API_211_KEY: "secret" })).toThrow("ALLOW_211_SYNC=1")
    expect(() => assert211SyncEnabled({ ALLOW_211_SYNC: "1" })).toThrow("Missing API_211_KEY")
    expect(() => assert211SyncEnabled({ ALLOW_211_SYNC: "1", API_211_KEY: "secret" })).not.toThrow()
  })

  it("fails closed when the 211 API key is missing", async () => {
    delete process.env.API_211_KEY

    await expect(fetch211Services()).rejects.toThrow("Missing API_211_KEY")
  })

  it("maps live 211 API responses without emitting mock records", async () => {
    process.env.API_211_KEY = "secret"
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "service-123",
          name: "Example Shelter",
          description: "Emergency shelter support",
          address: { street: "1 Princess St", city: "Kingston", postal: "K7L 1A1" },
          phone: "613-555-0100",
          url: "https://example.org",
          taxonomy: [{ code: "BH-1800", name: "Homeless Shelter" }],
        },
      ],
    })
    vi.stubGlobal("fetch", fetchMock)

    const services = await fetch211Services()

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(services).toHaveLength(1)
    expect(services[0]?.id).toBe("211-service-123")
    expect(services[0]?.name).toBe("Example Shelter")
    expect(services[0]?.verification_level).toBe(VerificationLevel.L2)
    expect(services[0]?.intent_category).toBe(IntentCategory.Housing)
  })
})
