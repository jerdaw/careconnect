import fs from "fs"
import { createHash } from "crypto"
import path from "path"
import { pathToFileURL } from "url"

import type { BroadCoverageCorrectionManifest } from "./prepare-broad-coverage-production-correction"

type SqlGuardrails = BroadCoverageCorrectionManifest["guardrails"]["applySql"]

export type BroadCoverageVerificationArgs = {
  manifestPath: string
}

export type BroadCoverageVerificationResult = {
  ok: boolean
  failures: string[]
  checked: {
    ids: number
    idsMatchSummary: boolean
    applySqlIdsMatchManifest: boolean
    rollbackSqlIdsMatchManifest?: boolean
    applySqlBytesMatch: boolean
    rollbackSqlBytesMatch?: boolean
    applySqlSha256Matches: boolean
    rollbackSqlSha256Matches?: boolean
    applyGuardrailsMatch: boolean
    rollbackGuardrailsMatch?: boolean
    writesEnabledFalse: boolean
  }
}

export function parseBroadCoverageVerificationArgs(argv: string[]): BroadCoverageVerificationArgs {
  let manifestPath: string | undefined

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--manifest") {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) {
        throw new Error("--manifest requires a value")
      }
      manifestPath = value
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!manifestPath) throw new Error("--manifest is required")

  return { manifestPath }
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

function unescapeSqlString(value: string): string {
  return value.replaceAll("''", "'")
}

function extractReviewedIds(sql: string): string[] {
  const ids = new Set<string>()
  const rowStart = /\(\s*'((?:''|[^'])+)'::text\s*,/g
  let match: RegExpExecArray | null

  while ((match = rowStart.exec(sql)) !== null) {
    if (match[1]) ids.add(unescapeSqlString(match[1]))
  }

  return [...ids].sort((left, right) => left.localeCompare(right))
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function sameStringSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  const sortedLeft = [...left].sort((a, b) => a.localeCompare(b))
  const sortedRight = [...right].sort((a, b) => a.localeCompare(b))
  return sortedLeft.every((value, index) => value === sortedRight[index])
}

function addFailureIf(failures: string[], condition: boolean, message: string): void {
  if (condition) failures.push(message)
}

export function verifyBroadCoverageCorrectionManifest(input: {
  manifest: BroadCoverageCorrectionManifest
  applySql: string
  rollbackSql?: string
}): BroadCoverageVerificationResult {
  const failures: string[] = []
  const correctionCount = input.manifest.summary.corrections
  const idsMatchSummary = input.manifest.ids.length === correctionCount
  const applySqlIdsMatchManifest = sameStringSet(extractReviewedIds(input.applySql), input.manifest.ids)
  const applySqlBytesMatch = Buffer.byteLength(input.applySql) === input.manifest.artifacts.applySql.bytes
  const applySqlSha256Matches = sha256(input.applySql) === input.manifest.artifacts.applySql.sha256
  const applyGuardrails = buildSqlGuardrails(input.applySql, correctionCount, false)
  const applyGuardrailsMatch = sameJson(applyGuardrails, input.manifest.guardrails.applySql)
  const writesEnabledFalse = input.manifest.writesEnabled === false

  addFailureIf(failures, !idsMatchSummary, "Manifest IDs must match summary correction count")
  addFailureIf(failures, !applySqlIdsMatchManifest, "Apply SQL reviewed IDs mismatch")
  addFailureIf(failures, !applySqlBytesMatch, "Apply SQL byte count mismatch")
  addFailureIf(
    failures,
    input.manifest.schemaVersion !== "careconnect-broad-coverage-correction-manifest-v1",
    "Unsupported manifest schema"
  )
  addFailureIf(failures, input.manifest.mode !== "dry-run-sql-prep", "Manifest mode must be dry-run-sql-prep")
  addFailureIf(failures, !writesEnabledFalse, "Manifest writesEnabled must be false")
  addFailureIf(failures, !applySqlSha256Matches, "Apply SQL SHA-256 mismatch")
  addFailureIf(failures, !applyGuardrailsMatch, "Apply SQL guardrails mismatch")

  let rollbackSqlIdsMatchManifest: boolean | undefined
  let rollbackSqlBytesMatch: boolean | undefined
  let rollbackSqlSha256Matches: boolean | undefined
  let rollbackGuardrailsMatch: boolean | undefined

  if (input.manifest.artifacts.rollbackSql || input.manifest.guardrails.rollbackSql) {
    if (!input.rollbackSql) {
      rollbackSqlIdsMatchManifest = false
      rollbackSqlBytesMatch = false
      rollbackSqlSha256Matches = false
      rollbackGuardrailsMatch = false
      failures.push("Rollback SQL missing")
    } else if (input.manifest.artifacts.rollbackSql && input.manifest.guardrails.rollbackSql) {
      rollbackSqlIdsMatchManifest = sameStringSet(extractReviewedIds(input.rollbackSql), input.manifest.ids)
      rollbackSqlBytesMatch = Buffer.byteLength(input.rollbackSql) === input.manifest.artifacts.rollbackSql.bytes
      rollbackSqlSha256Matches = sha256(input.rollbackSql) === input.manifest.artifacts.rollbackSql.sha256
      const rollbackGuardrails = buildSqlGuardrails(input.rollbackSql, correctionCount, true)
      rollbackGuardrailsMatch = sameJson(rollbackGuardrails, input.manifest.guardrails.rollbackSql)

      addFailureIf(failures, !rollbackSqlIdsMatchManifest, "Rollback SQL reviewed IDs mismatch")
      addFailureIf(failures, !rollbackSqlBytesMatch, "Rollback SQL byte count mismatch")
      addFailureIf(failures, !rollbackSqlSha256Matches, "Rollback SQL SHA-256 mismatch")
      addFailureIf(failures, !rollbackGuardrailsMatch, "Rollback SQL guardrails mismatch")
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    checked: {
      ids: input.manifest.ids.length,
      idsMatchSummary,
      applySqlIdsMatchManifest,
      rollbackSqlIdsMatchManifest,
      applySqlBytesMatch,
      rollbackSqlBytesMatch,
      applySqlSha256Matches,
      rollbackSqlSha256Matches,
      applyGuardrailsMatch,
      rollbackGuardrailsMatch,
      writesEnabledFalse,
    },
  }
}

function readManifest(manifestPath: string): BroadCoverageCorrectionManifest {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as BroadCoverageCorrectionManifest
}

async function main(): Promise<void> {
  const args = parseBroadCoverageVerificationArgs(process.argv.slice(2))
  const manifest = readManifest(args.manifestPath)
  const applySql = fs.readFileSync(manifest.artifacts.applySql.path, "utf8")
  const rollbackSql = manifest.artifacts.rollbackSql
    ? fs.readFileSync(manifest.artifacts.rollbackSql.path, "utf8")
    : undefined
  const result = verifyBroadCoverageCorrectionManifest({
    manifest,
    applySql,
    rollbackSql,
  })

  console.log(JSON.stringify(result, null, 2))

  if (!result.ok) {
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
