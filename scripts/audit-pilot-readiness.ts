#!/usr/bin/env tsx
import fs from "fs/promises"
import path from "path"
import dotenv from "dotenv"
import {
  buildPilotReadinessReport,
  loadPilotScopeEntriesFromFile,
  loadPilotScopeEntriesFromSupabase,
  renderPilotReadinessCsv,
  renderPilotReadinessMarkdown,
} from "../lib/pilot/readiness-audit"
import type { Service } from "../types/service"

dotenv.config({ path: ".env.local" })

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

async function main() {
  const pilotCycleId = getArg("--pilot-cycle-id")
  const orgId = getArg("--org-id")
  const scopeFile = getArg("--scope-file")
  const outDir = getArg("--out-dir") ?? path.join("docs", "implementation", "v22-pilot-readiness")

  if (!pilotCycleId && !scopeFile) {
    console.error(
      "Usage: node --import tsx scripts/audit-pilot-readiness.ts --pilot-cycle-id <id> [--org-id <uuid>] [--out-dir <dir>]"
    )
    console.error("   or: node --import tsx scripts/audit-pilot-readiness.ts --scope-file <path> [--out-dir <dir>]")
    process.exit(1)
  }

  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const services = JSON.parse(await fs.readFile(servicesPath, "utf-8")) as Service[]

  const scopeEntries = scopeFile
    ? await loadPilotScopeEntriesFromFile(scopeFile)
    : await (() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SECRET_KEY

        if (!supabaseUrl || !supabaseKey) {
          throw new Error(
            "Missing Supabase credentials. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local"
          )
        }

        return loadPilotScopeEntriesFromSupabase({
          supabaseUrl,
          supabaseKey,
          pilotCycleId: pilotCycleId!,
          orgId,
        })
      })()

  if (!scopeEntries.length) {
    console.error("No pilot scope entries found.")
    process.exit(1)
  }

  const report = buildPilotReadinessReport(services, scopeEntries)
  await fs.mkdir(outDir, { recursive: true })

  await fs.writeFile(path.join(outDir, "pilot-readiness-audit.json"), JSON.stringify(report, null, 2) + "\n")
  await fs.writeFile(path.join(outDir, "pilot-readiness-summary.md"), renderPilotReadinessMarkdown(report) + "\n")
  await fs.writeFile(path.join(outDir, "pilot-verification-worksheet.csv"), renderPilotReadinessCsv(report) + "\n")

  console.log(`Pilot readiness audit written to ${outDir}`)
  console.log(`Scoped services: ${report.total_scoped_services}`)
  console.log(`Matched services: ${report.matched_services}`)
  console.log(`Missing local service records: ${report.missing_service_records.length}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
