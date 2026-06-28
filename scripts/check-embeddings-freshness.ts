import { readFileSync } from "node:fs"
import path from "node:path"

type ServiceRecord = {
  id?: unknown
}

type EmbeddingMap = Record<string, unknown>

export type EmbeddingFreshnessIssue = {
  id?: string
  type: "missing-service-id" | "duplicate-service-id" | "missing-embedding" | "extra-embedding" | "invalid-vector"
  message: string
}

export type EmbeddingFreshnessResult = {
  passed: boolean
  serviceCount: number
  embeddingCount: number
  expectedDimensions: number
  issues: EmbeddingFreshnessIssue[]
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T
}

function isFiniteNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
}

export function checkEmbeddingsFreshness({
  servicesPath = path.join(process.cwd(), "data/services.json"),
  embeddingsPath = path.join(process.cwd(), "data/embeddings.json"),
  expectedDimensions = 384,
}: {
  servicesPath?: string
  embeddingsPath?: string
  expectedDimensions?: number
} = {}): EmbeddingFreshnessResult {
  const services = readJson<ServiceRecord[]>(servicesPath)
  const embeddings = readJson<EmbeddingMap>(embeddingsPath)
  const issues: EmbeddingFreshnessIssue[] = []
  const serviceIds = new Set<string>()

  for (const [index, service] of services.entries()) {
    if (typeof service.id !== "string" || service.id.trim() === "") {
      issues.push({
        type: "missing-service-id",
        message: `Service at index ${index} is missing a string id.`,
      })
      continue
    }

    if (serviceIds.has(service.id)) {
      issues.push({
        id: service.id,
        type: "duplicate-service-id",
        message: `Service id '${service.id}' appears more than once.`,
      })
    }

    serviceIds.add(service.id)
  }

  for (const id of serviceIds) {
    if (!(id in embeddings)) {
      issues.push({
        id,
        type: "missing-embedding",
        message: `Service '${id}' is missing from data/embeddings.json.`,
      })
    }
  }

  for (const [id, vector] of Object.entries(embeddings)) {
    if (!serviceIds.has(id)) {
      issues.push({
        id,
        type: "extra-embedding",
        message: `Embedding '${id}' does not match any service id.`,
      })
      continue
    }

    if (!isFiniteNumberArray(vector) || vector.length !== expectedDimensions) {
      issues.push({
        id,
        type: "invalid-vector",
        message: `Embedding '${id}' must be a ${expectedDimensions}-dimension finite number array.`,
      })
    }
  }

  return {
    passed: issues.length === 0,
    serviceCount: serviceIds.size,
    embeddingCount: Object.keys(embeddings).length,
    expectedDimensions,
    issues,
  }
}

function main() {
  const result = checkEmbeddingsFreshness()

  console.log("Embedding freshness check")
  console.log(`Services: ${result.serviceCount}`)
  console.log(`Embeddings: ${result.embeddingCount}`)
  console.log(`Expected dimensions: ${result.expectedDimensions}`)

  if (result.passed) {
    console.log("OK: data/embeddings.json matches service ids and vector shape.")
    return
  }

  console.error(`FAILED: ${result.issues.length} embedding issue(s) found.`)
  for (const issue of result.issues) {
    console.error(`- ${issue.message}`)
  }

  process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
