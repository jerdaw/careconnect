import fs from "fs"
import { createHash } from "crypto"
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
  manifestOutPath?: string
}

type SqlGuardrails = {
  hasBegin: boolean
  hasCommit: boolean
  targetsPublicServices: boolean
  setColumns: string[]
  disallowedSetColumnsPresent: string[]
  mentionsBramptonIds: boolean
  hasExactAssertion: boolean
}

export type BroadCoverageCorrectionManifest = {
  schemaVersion: "careconnect-broad-coverage-correction-manifest-v1"
  mode: "dry-run-sql-prep"
  writesEnabled: false
  generatedAt: string
  summary: ReturnType<typeof buildBroadCoverageCorrectionPlan>["summary"]
  ids: string[]
  artifacts: {
    applySql: {
      path: string
      bytes: number
      sha256: string
    }
    rollbackSql?: {
      path: string
      bytes: number
      sha256: string
    }
  }
  guardrails: {
    applySql: SqlGuardrails
    rollbackSql?: SqlGuardrails
  }
}

export function parseBroadCoverageCorrectionArgs(argv: string[]): BroadCoverageCorrectionArgs {
  let snapshotPath: string | undefined
  let sqlOutPath: string | undefined
  let rollbackOutPath: string | undefined
  let manifestOutPath: string | undefined

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

    if (arg === "--manifest-out") {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) {
        throw new Error("--manifest-out requires a value")
      }
      manifestOutPath = value
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!snapshotPath) throw new Error("--snapshot is required")
  if (!sqlOutPath) throw new Error("--sql-out is required")

  return { snapshotPath, sqlOutPath, rollbackOutPath, manifestOutPath }
}

function readSnapshot(snapshotPath: string): ProductionCoverageRow[] {
  const parsed = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as unknown
  if (!Array.isArray(parsed)) {
    throw new Error("Snapshot must be an array of production coverage rows")
  }
  return parsed as ProductionCoverageRow[]
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function getSetColumns(sql: string): string[] {
  const setMatch = /set\s+([\s\S]*?)\s+from updates/i.exec(sql)
  if (!setMatch?.[1]) return []

  return setMatch[1]
    .split(",")
    .map((line) => line.trim().match(/^([a-z_]+)\s*=/i)?.[1])
    .filter((column): column is string => Boolean(column))
}

function buildSqlGuardrails(sql: string, correctionCount: number, rollback: boolean): SqlGuardrails {
  const setColumns = getSetColumns(sql)
  const allowedSetColumns = new Set(["scope", "primary_place_id", "coverage"])
  const expectedAssertion = rollback
    ? `Expected to roll back exactly ${correctionCount} broad coverage rows`
    : `Expected to update exactly ${correctionCount} broad coverage rows`

  return {
    hasBegin: /\bbegin;/i.test(sql),
    hasCommit: /\bcommit;/i.test(sql),
    targetsPublicServices: /update public\.services/i.test(sql),
    setColumns,
    disallowedSetColumnsPresent: setColumns.filter((column) => !allowedSetColumns.has(column)),
    mentionsBramptonIds: /brampton-/i.test(sql),
    hasExactAssertion: sql.includes(expectedAssertion),
  }
}

export function buildBroadCoverageCorrectionManifest(input: {
  plan: ReturnType<typeof buildBroadCoverageCorrectionPlan>
  applySql: string
  rollbackSql?: string
  applySqlPath: string
  rollbackSqlPath?: string
  generatedAt?: string
}): BroadCoverageCorrectionManifest {
  return {
    schemaVersion: "careconnect-broad-coverage-correction-manifest-v1",
    mode: "dry-run-sql-prep",
    writesEnabled: false,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    summary: input.plan.summary,
    ids: input.plan.corrections.map((item) => item.id),
    artifacts: {
      applySql: {
        path: input.applySqlPath,
        bytes: Buffer.byteLength(input.applySql),
        sha256: sha256(input.applySql),
      },
      ...(input.rollbackSql && input.rollbackSqlPath
        ? {
            rollbackSql: {
              path: input.rollbackSqlPath,
              bytes: Buffer.byteLength(input.rollbackSql),
              sha256: sha256(input.rollbackSql),
            },
          }
        : {}),
    },
    guardrails: {
      applySql: buildSqlGuardrails(input.applySql, input.plan.summary.corrections, false),
      ...(input.rollbackSql
        ? {
            rollbackSql: buildSqlGuardrails(input.rollbackSql, input.plan.summary.corrections, true),
          }
        : {}),
    },
  }
}

async function main(): Promise<void> {
  const args = parseBroadCoverageCorrectionArgs(process.argv.slice(2))
  const productionRows = readSnapshot(args.snapshotPath)
  const plan = buildBroadCoverageCorrectionPlan({
    services: servicesRaw as Service[],
    productionRows,
  })
  const sql = buildBroadCoverageCorrectionSql(plan)
  const rollbackSql = args.rollbackOutPath ? buildBroadCoverageRollbackSql(plan) : undefined

  fs.mkdirSync(path.dirname(args.sqlOutPath), { recursive: true })
  fs.writeFileSync(args.sqlOutPath, sql)

  if (args.rollbackOutPath && rollbackSql) {
    fs.mkdirSync(path.dirname(args.rollbackOutPath), { recursive: true })
    fs.writeFileSync(args.rollbackOutPath, rollbackSql)
  }

  if (args.manifestOutPath) {
    const manifest = buildBroadCoverageCorrectionManifest({
      plan,
      applySql: sql,
      rollbackSql,
      applySqlPath: args.sqlOutPath,
      rollbackSqlPath: args.rollbackOutPath,
    })
    fs.mkdirSync(path.dirname(args.manifestOutPath), { recursive: true })
    fs.writeFileSync(args.manifestOutPath, `${JSON.stringify(manifest, null, 2)}\n`)
  }

  console.log(
    JSON.stringify(
      {
        mode: "dry-run-sql-prep",
        writesEnabled: false,
        sqlOutPath: args.sqlOutPath,
        rollbackOutPath: args.rollbackOutPath,
        manifestOutPath: args.manifestOutPath,
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
