/** @vitest-environment node */
import { describe, expect, it } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { checkEmbeddingsFreshness } from "@/scripts/check-embeddings-freshness"

function withFixture<T>({
  services,
  embeddings,
  run,
}: {
  services: unknown
  embeddings: unknown
  run: (paths: { servicesPath: string; embeddingsPath: string }) => T
}): T {
  const dir = mkdtempSync(path.join(os.tmpdir(), "careconnect-embeddings-"))

  try {
    const servicesPath = path.join(dir, "services.json")
    const embeddingsPath = path.join(dir, "embeddings.json")
    writeFileSync(servicesPath, JSON.stringify(services))
    writeFileSync(embeddingsPath, JSON.stringify(embeddings))

    return run({ servicesPath, embeddingsPath })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe("checkEmbeddingsFreshness", () => {
  it("passes when every service has one correctly shaped embedding", () => {
    const result = withFixture({
      services: [{ id: "s1" }, { id: "s2" }],
      embeddings: {
        s1: [0.1, 0.2],
        s2: [0.3, 0.4],
      },
      run: (paths) => checkEmbeddingsFreshness({ ...paths, expectedDimensions: 2 }),
    })

    expect(result.passed).toBe(true)
    expect(result.issues).toEqual([])
    expect(result.serviceCount).toBe(2)
    expect(result.embeddingCount).toBe(2)
  })

  it("reports missing, extra, duplicate, and invalid embeddings", () => {
    const result = withFixture({
      services: [{ id: "s1" }, { id: "s1" }, { id: "s2" }, {}],
      embeddings: {
        s1: [0.1],
        extra: [0.2, 0.3],
      },
      run: (paths) => checkEmbeddingsFreshness({ ...paths, expectedDimensions: 2 }),
    })

    expect(result.passed).toBe(false)
    expect(result.issues.map((issue) => issue.type)).toEqual([
      "duplicate-service-id",
      "missing-service-id",
      "missing-embedding",
      "invalid-vector",
      "extra-embedding",
    ])
  })
})
