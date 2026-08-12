import { promises as fs } from "node:fs"
import path from "node:path"
import { PUBLIC_SERVICE_MODE } from "../lib/public-service-mode-value"

interface ServiceMarkerSource {
  id?: unknown
  name?: unknown
  phone?: unknown
  url?: unknown
}

const repoRoot = process.cwd()
const clientRoot = path.join(repoRoot, ".next", "static")
const serviceWorkerPath = path.join(repoRoot, "public", "sw.js")

async function walkFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? walkFiles(entryPath) : [entryPath]
    })
  )
  return files.flat()
}

function stringMarkers(service: ServiceMarkerSource): string[] {
  return [service.id, service.name, service.phone, service.url].filter(
    (value): value is string => typeof value === "string" && value.length >= 8
  )
}

async function main() {
  if (PUBLIC_SERVICE_MODE !== "retired") {
    console.log("Retirement artifact check skipped: public service mode is active.")
    return
  }

  const services = JSON.parse(
    await fs.readFile(path.join(repoRoot, "data", "services.json"), "utf8")
  ) as ServiceMarkerSource[]
  const embeddings = JSON.parse(await fs.readFile(path.join(repoRoot, "data", "embeddings.json"), "utf8")) as Record<
    string,
    number[]
  >
  const sourceFiles = (
    await Promise.all(
      ["app", "components", "hooks", "lib", "i18n"].map((directory) => walkFiles(path.join(repoRoot, directory)))
    )
  )
    .flat()
    .filter((filePath) => /\.(?:js|jsx|ts|tsx)$/.test(filePath))
  const sourceText = (await Promise.all(sourceFiles.map((filePath) => fs.readFile(filePath, "utf8")))).join("\n")
  const corpusMarkers = services
    .flatMap(stringMarkers)
    .filter((marker, index, markers) => markers.indexOf(marker) === index && !sourceText.includes(marker))

  if (corpusMarkers.length < 20) {
    throw new Error("Retirement artifact check could not derive enough corpus-only markers.")
  }

  const firstEmbedding = Object.values(embeddings).find((vector) => Array.isArray(vector) && vector.length >= 12)
  if (!firstEmbedding) {
    throw new Error("Retirement artifact check could not derive an embedding signature.")
  }
  const embeddingSignature = JSON.stringify(firstEmbedding.slice(0, 12)).slice(1, -1)

  const artifactFiles = (await walkFiles(clientRoot)).filter((filePath) => /\.(?:js|json|map)$/.test(filePath))
  const serviceWorkerExists = await fs
    .access(serviceWorkerPath)
    .then(() => true)
    .catch(() => false)
  if (serviceWorkerExists) artifactFiles.push(serviceWorkerPath)
  const violations: string[] = []

  for (const artifactPath of artifactFiles) {
    const artifact = await fs.readFile(artifactPath, "utf8")
    if (corpusMarkers.some((marker) => artifact.includes(marker)) || artifact.includes(embeddingSignature)) {
      violations.push(path.relative(repoRoot, artifactPath))
    }
  }

  if (violations.length > 0) {
    throw new Error(`Retirement client artifacts contain governed data markers: ${violations.join(", ")}`)
  }

  console.log(
    `Retirement artifact check passed across ${artifactFiles.length} generated files using ${corpusMarkers.length} corpus-only markers${serviceWorkerExists ? ", including the generated service worker" : "; no service worker was generated in this build mode"}.`
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
