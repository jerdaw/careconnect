/**
 * L3 Candidate Suggestions Export
 *
 * Produces a machine-readable list of suggested candidates for L3 verification outreach.
 * This does NOT change service data. It is a planning aid for Phase 6.
 *
 * Usage:
 *   node --import tsx scripts/export-l3-candidate-suggestions.ts
 *   node --import tsx scripts/export-l3-candidate-suggestions.ts --out docs/roadmaps/v17-5-verification/outputs/l3-candidate-suggestions.json
 */

import fs from "fs/promises"
import path from "path"

interface Service {
  id: string
  name: string
  intent_category?: string
  scope?: string
  verification_level?: string
  authority_tier?: string
  url?: string
  phone?: string
  email?: string
  org_id?: string
  status?: string
  published?: boolean
  deleted_at?: string | null
}

interface Suggestion {
  id: string
  name: string
  intent_category: string | null
  scope: string | null
  verification_level: string | null
  authority_tier: string | null
  url: string | null
  has_phone: boolean
  has_email: boolean
  has_org_id: boolean
  score: number
  reasons: string[]
}

interface SuggestionsReport {
  generated_at: string
  criteria: {
    scope: string
    verification_level: string
    focus_categories: string[]
  }
  suggestions: Suggestion[]
}

function isActive(service: Service): boolean {
  if (service.deleted_at) return false
  if (service.published === false) return false
  if (service.status && service.status.toLowerCase().includes("permanently closed")) return false
  return true
}

function scoreService(service: Service): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  const tier = (service.authority_tier ?? "").toLowerCase()
  if (tier === "government") {
    score += 5
    reasons.push("authority_tier:government")
  } else if (tier === "healthcare") {
    score += 4
    reasons.push("authority_tier:healthcare")
  } else if (tier === "established_nonprofit") {
    score += 3
    reasons.push("authority_tier:established_nonprofit")
  } else if (tier === "community") {
    score += 1
    reasons.push("authority_tier:community")
  }

  const category = service.intent_category ?? ""
  if (category === "Crisis") {
    score += 4
    reasons.push("high_impact:crisis")
  } else if (category === "Health") {
    score += 3
    reasons.push("high_impact:health")
  } else if (category === "Housing") {
    score += 3
    reasons.push("high_impact:housing")
  } else if (category === "Food") {
    score += 2
    reasons.push("high_impact:food")
  }

  if (service.org_id) {
    score += 2
    reasons.push("has_org_id")
  }
  if (service.email) {
    score += 1
    reasons.push("has_email")
  }
  if (service.phone) {
    score += 1
    reasons.push("has_phone")
  }

  return { score, reasons }
}

function parseArgs(argv: string[]): { outPath: string } {
  const outIndex = argv.indexOf("--out")
  const outPath =
    outIndex >= 0 ? argv[outIndex + 1] : "docs/roadmaps/v17-5-verification/outputs/l3-candidate-suggestions.json"
  if (!outPath || outPath.startsWith("--")) {
    throw new Error(
      "Invalid --out value. Example: --out docs/roadmaps/v17-5-verification/outputs/l3-candidate-suggestions.json"
    )
  }
  return { outPath }
}

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

async function main() {
  const { outPath } = parseArgs(process.argv.slice(2))

  const focusCategories = ["Crisis", "Health", "Housing", "Food"]

  const services = await loadServices()
  const eligible = services.filter(
    (s) =>
      isActive(s) &&
      s.scope === "kingston" &&
      s.verification_level === "L2" &&
      !!s.intent_category &&
      focusCategories.includes(s.intent_category)
  )

  const suggestions: Suggestion[] = eligible
    .map((service) => {
      const { score, reasons } = scoreService(service)
      return {
        id: service.id,
        name: service.name,
        intent_category: service.intent_category ?? null,
        scope: service.scope ?? null,
        verification_level: service.verification_level ?? null,
        authority_tier: service.authority_tier ?? null,
        url: service.url ?? null,
        has_phone: !!service.phone,
        has_email: !!service.email,
        has_org_id: !!service.org_id,
        score,
        reasons,
      }
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  const report: SuggestionsReport = {
    generated_at: new Date().toISOString(),
    criteria: {
      scope: "kingston",
      verification_level: "L2",
      focus_categories: focusCategories,
    },
    suggestions,
  }

  const absOut = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath)
  await fs.mkdir(path.dirname(absOut), { recursive: true })
  await fs.writeFile(absOut, JSON.stringify(report, null, 2) + "\n", "utf-8")

  console.log(`✅ Wrote L3 candidate suggestions: ${outPath}`)
  console.log(`  Eligible services: ${eligible.length}`)
  console.log(`  Suggestions exported: ${suggestions.length}`)
}

main().catch((error) => {
  console.error("Error exporting L3 candidate suggestions:", error)
  process.exit(1)
})
