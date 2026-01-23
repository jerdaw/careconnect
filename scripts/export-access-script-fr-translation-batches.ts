/**
 * Access Script (FR) Translation Batch Export
 *
 * Produces small input batches for translating `access_script` → `access_script_fr`.
 *
 * Governance note:
 * - This script does NOT change service data.
 * - Translation must preserve meaning and MUST NOT introduce new factual claims.
 *
 * Usage:
 *   node --import tsx scripts/export-access-script-fr-translation-batches.ts
 *   node --import tsx scripts/export-access-script-fr-translation-batches.ts --batch-size 40 --out-dir docs/audits/v17-5/ai-results/access-script-fr/input
 *   node --import tsx scripts/export-access-script-fr-translation-batches.ts --all --batch-size 40
 */

import fs from "fs/promises"
import path from "path"

interface Service {
  id: string
  name: string
  name_fr?: string
  scope?: string
  status?: string
  published?: boolean
  deleted_at?: string | null
  access_script?: string
  access_script_fr?: string
}

interface TranslationInputItem {
  id: string
  name: string
  name_fr: string | null
  scope: string | null
  access_script: string
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isActive(service: Service): boolean {
  if (service.deleted_at) return false
  if (service.published === false) return false
  if (service.status && service.status.toLowerCase().includes("permanently closed")) return false
  return true
}

function parseArgs(argv: string[]): { outDir: string; batchSize: number; all: boolean } {
  const outIndex = argv.indexOf("--out-dir")
  const outDir = outIndex >= 0 ? argv[outIndex + 1] : "docs/audits/v17-5/ai-results/access-script-fr/input"
  if (!outDir || outDir.startsWith("--")) {
    throw new Error("Invalid --out-dir value. Example: --out-dir docs/audits/v17-5/ai-results/access-script-fr/input")
  }

  const sizeIndex = argv.indexOf("--batch-size")
  const batchSizeRaw = sizeIndex >= 0 ? argv[sizeIndex + 1] : "40"
  const batchSize = Number(batchSizeRaw)
  if (!Number.isFinite(batchSize) || batchSize <= 0 || batchSize > 200) {
    throw new Error("Invalid --batch-size value. Use an integer between 1 and 200.")
  }

  const all = argv.includes("--all")
  return { outDir, batchSize, all }
}

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

async function main() {
  const { outDir, batchSize, all } = parseArgs(process.argv.slice(2))
  const services = await loadServices()

  const candidates = services
    .filter((s) => isActive(s))
    .filter((s) => hasText(s.access_script))
    .filter((s) => all || !hasText(s.access_script_fr))
    .map<TranslationInputItem>((s) => ({
      id: s.id,
      name: s.name,
      name_fr: s.name_fr ?? null,
      scope: s.scope ?? null,
      access_script: (s.access_script as string).trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const batches = chunk(candidates, batchSize)
  const absOutDir = path.isAbsolute(outDir) ? outDir : path.join(process.cwd(), outDir)
  await fs.mkdir(absOutDir, { recursive: true })

  for (let i = 0; i < batches.length; i++) {
    const n = String(i + 1).padStart(3, "0")
    const filename = `batch-${n}.input.json`
    const filePath = path.join(absOutDir, filename)
    await fs.writeFile(
      filePath,
      JSON.stringify({ batch: i + 1, total_batches: batches.length, items: batches[i] }, null, 2) + "\n",
      "utf-8"
    )
  }

  console.log(`✅ Wrote ${batches.length} translation input batches to: ${outDir}`)
  console.log(`  Active services with access_script: ${candidates.length}`)
  console.log(`  Batch size: ${batchSize}`)
}

main().catch((error) => {
  console.error("Error exporting access_script_fr translation batches:", error)
  process.exit(1)
})
