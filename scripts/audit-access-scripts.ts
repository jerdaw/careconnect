/**
 * Access Script Quality Audit
 *
 * Produces a machine-readable report to support v17.5 Phase 4 governance QA.
 *
 * Governance note:
 * - This script does NOT change service data.
 * - Do not treat "passes audit" as proof of factual correctness; it only flags obvious issues.
 *
 * Usage:
 *   node --import tsx scripts/audit-access-scripts.ts
 *   node --import tsx scripts/audit-access-scripts.ts --out docs/roadmaps/v17-5-ai-results/reports/access-script-audit.json
 *   node --import tsx scripts/audit-access-scripts.ts --all --out docs/roadmaps/v17-5-ai-results/reports/access-script-audit.all.json
 */

import fs from "fs/promises"
import path from "path"

interface Service {
  id: string
  name: string
  intent_category?: string
  scope?: string
  status?: string
  published?: boolean
  deleted_at?: string | null
  access_script?: string
  access_script_fr?: string
}

type AccessScriptIssue = "missing_access_script" | "missing_access_script_fr" | "suspicious_model_artifact"

interface AccessScriptAuditItem {
  id: string
  name: string
  intent_category: string | null
  scope: string | null
  status: string | null
  is_active: boolean
  access_script_chars: number
  access_script_words: number
  access_script_fr_chars: number
  access_script_fr_words: number
  issues: AccessScriptIssue[]
}

interface AccessScriptAuditReport {
  generated_at: string
  emits_only_issues: boolean
  issues_breakdown: Record<AccessScriptIssue, number>
  totals: {
    total_services: number
    active_services: number
    missing_access_script_any: number
    missing_access_script_active: number
    missing_access_script_fr_any: number
    missing_access_script_fr_active: number
  }
  items: AccessScriptAuditItem[]
}

function isActive(service: Service): boolean {
  if (service.deleted_at) return false
  if (service.published === false) return false
  if (service.status && service.status.toLowerCase().includes("permanently closed")) return false
  return true
}

function countWords(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function parseArgs(argv: string[]): { outPath: string | null; all: boolean } {
  const outIndex = argv.indexOf("--out")
  const outPath = outIndex >= 0 ? argv[outIndex + 1] : null
  if (outIndex >= 0 && (!outPath || outPath.startsWith("--"))) {
    throw new Error(
      "Invalid --out value. Example: --out docs/roadmaps/v17-5-ai-results/reports/access-script-audit.json"
    )
  }
  const all = argv.includes("--all")
  return { outPath, all }
}

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function hasModelArtifact(value: string): boolean {
  const lower = value.toLowerCase()
  return (
    lower.includes("as an ai") || lower.includes("i am an ai") || lower.includes("chatgpt") || lower.includes("gemini")
  )
}

async function main() {
  const { outPath, all } = parseArgs(process.argv.slice(2))

  const services = await loadServices()

  let activeServices = 0
  let missingAccessAny = 0
  let missingAccessActive = 0
  let missingAccessFrAny = 0
  let missingAccessFrActive = 0

  const issuesBreakdown: Record<AccessScriptIssue, number> = {
    missing_access_script: 0,
    missing_access_script_fr: 0,
    suspicious_model_artifact: 0,
  }

  const itemsAll: AccessScriptAuditItem[] = services.map((service) => {
    const active = isActive(service)
    if (active) activeServices++

    const script = service.access_script ?? ""
    const scriptFr = service.access_script_fr ?? ""

    const accessScriptChars = script.length
    const accessScriptWords = countWords(script)
    const accessScriptFrChars = scriptFr.length
    const accessScriptFrWords = countWords(scriptFr)

    const issues: AccessScriptIssue[] = []

    if (!hasText(script)) {
      missingAccessAny++
      if (active) missingAccessActive++
      issues.push("missing_access_script")
      issuesBreakdown.missing_access_script++
    }

    if (!hasText(scriptFr)) {
      missingAccessFrAny++
      if (active) missingAccessFrActive++
      issues.push("missing_access_script_fr")
      issuesBreakdown.missing_access_script_fr++
    }

    if (hasText(script) && hasModelArtifact(script)) {
      issues.push("suspicious_model_artifact")
      issuesBreakdown.suspicious_model_artifact++
    }

    return {
      id: service.id,
      name: service.name,
      intent_category: service.intent_category ?? null,
      scope: service.scope ?? null,
      status: service.status ?? null,
      is_active: active,
      access_script_chars: accessScriptChars,
      access_script_words: accessScriptWords,
      access_script_fr_chars: accessScriptFrChars,
      access_script_fr_words: accessScriptFrWords,
      issues,
    }
  })

  const items = all ? itemsAll : itemsAll.filter((item) => item.issues.length > 0)

  const report: AccessScriptAuditReport = {
    generated_at: new Date().toISOString(),
    emits_only_issues: !all,
    issues_breakdown: issuesBreakdown,
    totals: {
      total_services: services.length,
      active_services: activeServices,
      missing_access_script_any: missingAccessAny,
      missing_access_script_active: missingAccessActive,
      missing_access_script_fr_any: missingAccessFrAny,
      missing_access_script_fr_active: missingAccessFrActive,
    },
    items,
  }

  const output = JSON.stringify(report, null, 2) + "\n"

  if (outPath) {
    const absOut = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath)
    await fs.mkdir(path.dirname(absOut), { recursive: true })
    await fs.writeFile(absOut, output, "utf-8")
    console.log(`✅ Wrote access script audit: ${outPath}`)
    return
  }

  process.stdout.write(output)
}

main().catch((error) => {
  console.error("Error auditing access scripts:", error)
  process.exit(1)
})
