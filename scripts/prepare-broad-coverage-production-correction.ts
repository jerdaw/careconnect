import fs from "fs"
import path from "path"
import { pathToFileURL } from "url"

import servicesRaw from "../data/services.json"
import {
  buildBroadCoverageCorrectionPlan,
  buildBroadCoverageRollbackSql,
  buildBroadCoverageCorrectionSql,
  type ProductionCoverageRow,
} from "./lib/broad-coverage-production-correction"
import type { Service } from "../types/service"

export type BroadCoverageCorrectionArgs = {
  snapshotPath: string
  sqlOutPath: string
  rollbackOutPath?: string
}

export function parseBroadCoverageCorrectionArgs(argv: string[]): BroadCoverageCorrectionArgs {
  let snapshotPath: string | undefined
  let sqlOutPath: string | undefined
  let rollbackOutPath: string | undefined

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--snapshot") {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) {
        throw new Error("--snapshot requires a value")
      }
      snapshotPath = value
      index += 1
      continue
    }

    if (arg === "--sql-out") {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) {
        throw new Error("--sql-out requires a value")
      }
      sqlOutPath = value
      index += 1
      continue
    }

    if (arg === "--rollback-out") {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) {
        throw new Error("--rollback-out requires a value")
      }
      rollbackOutPath = value
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!snapshotPath) throw new Error("--snapshot is required")
  if (!sqlOutPath) throw new Error("--sql-out is required")

  return { snapshotPath, sqlOutPath, rollbackOutPath }
}

function readSnapshot(snapshotPath: string): ProductionCoverageRow[] {
  const parsed = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as unknown
  if (!Array.isArray(parsed)) {
    throw new Error("Snapshot must be an array of production coverage rows")
  }
  return parsed as ProductionCoverageRow[]
}

async function main(): Promise<void> {
  const args = parseBroadCoverageCorrectionArgs(process.argv.slice(2))
  const productionRows = readSnapshot(args.snapshotPath)
  const plan = buildBroadCoverageCorrectionPlan({
    services: servicesRaw as Service[],
    productionRows,
  })
  const sql = buildBroadCoverageCorrectionSql(plan)

  fs.mkdirSync(path.dirname(args.sqlOutPath), { recursive: true })
  fs.writeFileSync(args.sqlOutPath, sql)

  if (args.rollbackOutPath) {
    const rollbackSql = buildBroadCoverageRollbackSql(plan)
    fs.mkdirSync(path.dirname(args.rollbackOutPath), { recursive: true })
    fs.writeFileSync(args.rollbackOutPath, rollbackSql)
  }

  console.log(
    JSON.stringify(
      {
        mode: "dry-run-sql-prep",
        writesEnabled: false,
        sqlOutPath: args.sqlOutPath,
        rollbackOutPath: args.rollbackOutPath,
        summary: plan.summary,
        ids: plan.corrections.map((item) => item.id),
      },
      null,
      2
    )
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
