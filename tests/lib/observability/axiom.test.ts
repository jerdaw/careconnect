/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { mockIngest, mockFlush, MockAxiom, mockLogger } = vi.hoisted(() => {
  return {
    mockIngest: vi.fn().mockResolvedValue(undefined),
    mockFlush: vi.fn().mockResolvedValue(undefined),
    MockAxiom: vi.fn().mockImplementation(() => ({
      ingest: mockIngest,
      flush: mockFlush,
    })),
    mockLogger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  }
})

async function loadAxiomModule(envOverrides: Partial<Record<string, string | null>> = {}) {
  vi.resetModules()
  vi.doMock("@axiomhq/js", () => ({
    Axiom: MockAxiom,
  }))
  vi.doMock("@/lib/logger", () => ({
    logger: mockLogger,
  }))
  vi.doMock("@/lib/env", () => ({
    env: {
      AXIOM_TOKEN: "AXIOM_TOKEN" in envOverrides ? envOverrides.AXIOM_TOKEN : "axiom-token",
      AXIOM_ORG_ID: "AXIOM_ORG_ID" in envOverrides ? envOverrides.AXIOM_ORG_ID : "axiom-org",
      AXIOM_DATASET: "AXIOM_DATASET" in envOverrides ? envOverrides.AXIOM_DATASET : "test-dataset",
    },
  }))

  return import("@/lib/observability/axiom")
}

describe("Axiom observability", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("ingests performance events in production when credentials are configured", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const { sendPerformanceMetrics } = await loadAxiomModule()

    await sendPerformanceMetrics({ route: "/api/v1/health", latencyMs: 42 })

    expect(MockAxiom).toHaveBeenCalledWith({
      token: "axiom-token",
      orgId: "axiom-org",
    })
    expect(mockIngest).toHaveBeenCalledWith(
      "test-dataset",
      expect.arrayContaining([
        expect.objectContaining({
          type: "performance",
          route: "/api/v1/health",
          latencyMs: 42,
        }),
      ])
    )
  })

  it("warns and skips ingestion when credentials are missing", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const { ingestEvents } = await loadAxiomModule({
      AXIOM_TOKEN: null,
      AXIOM_ORG_ID: null,
    })

    await ingestEvents("test-dataset", [{ type: "health_check" }])

    expect(MockAxiom).not.toHaveBeenCalled()
    expect(mockIngest).not.toHaveBeenCalled()
    expect(mockLogger.warn).toHaveBeenCalledWith("Axiom credentials missing, observability disabled", {
      component: "axiom",
    })
  })

  it("flushes the initialized client", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const { sendHealthCheck, flushAxiom } = await loadAxiomModule()

    await sendHealthCheck({ ok: true })
    await flushAxiom()

    expect(mockFlush).toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith("Axiom client flushed", { component: "axiom" })
  })
})
