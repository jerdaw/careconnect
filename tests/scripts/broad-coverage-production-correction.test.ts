/** @vitest-environment node */
import { createHash } from "crypto"
import { describe, expect, it } from "vitest"

import servicesRaw from "@/data/services.json"
import {
  BROAD_COVERAGE_CORRECTION_APPROVAL_TOKEN,
  buildBroadCoverageCorrectionPlan,
  buildBroadCoverageRollbackSql,
  buildBroadCoverageCorrectionSql,
  type ProductionCoverageRow,
} from "@/scripts/lib/broad-coverage-production-correction"
import {
  buildBroadCoverageCorrectionManifest,
  parseBroadCoverageCorrectionArgs,
} from "@/scripts/prepare-broad-coverage-production-correction"
import {
  parseBroadCoverageVerificationArgs,
  verifyBroadCoverageCorrectionManifest,
} from "@/scripts/verify-broad-coverage-production-correction"
import type { Service } from "@/types/service"

const services = servicesRaw as Service[]

const productionSnapshot: ProductionCoverageRow[] = [
  {
    id: "ontario-211-ontario",
    scope: "kingston",
    primary_place_id: "kingston-on",
    coverage: [{ kind: "local", placeIds: ["kingston-on"] }],
  },
  {
    id: "kids-help-phone",
    scope: "kingston",
    primary_place_id: "kingston-on",
    coverage: [{ kind: "local", placeIds: ["kingston-on"] }],
  },
  {
    id: "ontario-naseeha",
    scope: "kingston",
    primary_place_id: "kingston-on",
    coverage: [{ kind: "local", placeIds: ["kingston-on"] }],
  },
  {
    id: "brampton-knights-table-food-bank-meals",
    scope: null,
    primary_place_id: "brampton-on",
    coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
  },
]

describe("broad coverage production correction", () => {
  it("uses an explicit non-empty approval token", () => {
    expect(BROAD_COVERAGE_CORRECTION_APPROVAL_TOKEN).toBe("I_APPROVE_FIXING_BROAD_COVERAGE_ONLY")
    expect(BROAD_COVERAGE_CORRECTION_APPROVAL_TOKEN.length).toBeGreaterThan(10)
  })

  it("selects repo broad records that production still stores as local", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: productionSnapshot,
    })

    expect(plan.corrections.map((item) => item.id).sort()).toEqual([
      "kids-help-phone",
      "ontario-211-ontario",
      "ontario-naseeha",
    ])
    expect(plan.summary).toEqual({
      productionRowsRead: 4,
      corrections: 3,
      provincial: 1,
      national: 2,
    })
  })

  it("does not select Brampton local launch records", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: productionSnapshot,
    })

    expect(plan.corrections.some((item) => item.id.startsWith("brampton-"))).toBe(false)
  })

  it("sets broad coverage from repo scope when explicit coverage is absent", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: productionSnapshot,
    })

    expect(plan.corrections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ontario-211-ontario",
          after: expect.objectContaining({
            scope: "ontario",
            primary_place_id: null,
            coverage: [{ kind: "provincial", label: "Ontario-wide" }],
          }),
        }),
        expect.objectContaining({
          id: "kids-help-phone",
          after: expect.objectContaining({
            scope: "canada",
            primary_place_id: null,
            coverage: [{ kind: "national", label: "Canada-wide" }],
          }),
        }),
        expect.objectContaining({
          id: "ontario-naseeha",
          after: expect.objectContaining({
            scope: "canada",
            primary_place_id: null,
            coverage: [{ kind: "national", label: "Canada-wide" }],
          }),
        }),
      ])
    )
  })

  it("ignores already-correct broad production rows", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: [
        {
          id: "ontario-211-ontario",
          scope: "ontario",
          primary_place_id: null,
          coverage: [{ kind: "provincial", label: "Ontario-wide" }],
        },
      ],
    })

    expect(plan.corrections).toEqual([])
  })

  it("generates bounded SQL with exact row-count and value assertions", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: productionSnapshot,
    })
    const sql = buildBroadCoverageCorrectionSql(plan)

    expect(sql).toContain("begin;")
    expect(sql).toContain("commit;")
    expect(sql).toContain("Expected to update exactly 3 broad coverage rows")
    expect(sql).toContain("where services.id = updates.id")
    expect(sql).toContain("services.coverage = updates.coverage")
    expect(sql).not.toContain("brampton-knights-table-food-bank-meals")
  })

  it("refuses to generate SQL for an empty correction plan", () => {
    expect(() =>
      buildBroadCoverageCorrectionSql({
        corrections: [],
        summary: {
          productionRowsRead: 0,
          corrections: 0,
          provincial: 0,
          national: 0,
        },
      })
    ).toThrow("No broad coverage corrections to write")
  })

  it("generates rollback SQL that restores the exact previous production values", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: productionSnapshot,
    })
    const sql = buildBroadCoverageRollbackSql(plan)

    expect(sql).toContain("begin;")
    expect(sql).toContain("commit;")
    expect(sql).toContain("Expected to roll back exactly 3 broad coverage rows")
    expect(sql).toContain("'kingston'::text")
    expect(sql).toContain("'kingston-on'::text")
    expect(sql).toContain('"placeIds":["kingston-on"]')
    expect(sql).not.toContain("brampton-knights-table-food-bank-meals")
  })
})

describe("broad coverage correction CLI parser", () => {
  it("requires a snapshot and SQL output path", () => {
    expect(() => parseBroadCoverageCorrectionArgs([])).toThrow("--snapshot is required")
    expect(() => parseBroadCoverageCorrectionArgs(["--snapshot", "/tmp/snapshot.json"])).toThrow(
      "--sql-out is required"
    )
  })

  it("rejects unknown arguments", () => {
    expect(() =>
      parseBroadCoverageCorrectionArgs(["--snapshot", "/tmp/snapshot.json", "--sql-out", "/tmp/out.sql", "--apply"])
    ).toThrow("Unknown argument: --apply")
  })

  it("rejects missing argument values", () => {
    expect(() => parseBroadCoverageCorrectionArgs(["--snapshot"])).toThrow("--snapshot requires a value")
    expect(() => parseBroadCoverageCorrectionArgs(["--snapshot", "/tmp/snapshot.json", "--sql-out"])).toThrow(
      "--sql-out requires a value"
    )
    expect(() =>
      parseBroadCoverageCorrectionArgs([
        "--snapshot",
        "/tmp/snapshot.json",
        "--sql-out",
        "/tmp/out.sql",
        "--rollback-out",
      ])
    ).toThrow("--rollback-out requires a value")
    expect(() =>
      parseBroadCoverageCorrectionArgs([
        "--snapshot",
        "/tmp/snapshot.json",
        "--sql-out",
        "/tmp/out.sql",
        "--manifest-out",
      ])
    ).toThrow("--manifest-out requires a value")
  })

  it("parses dry-run preparation arguments", () => {
    expect(parseBroadCoverageCorrectionArgs(["--snapshot", "/tmp/snapshot.json", "--sql-out", "/tmp/out.sql"])).toEqual(
      {
        snapshotPath: "/tmp/snapshot.json",
        sqlOutPath: "/tmp/out.sql",
        rollbackOutPath: undefined,
        manifestOutPath: undefined,
      }
    )

    expect(
      parseBroadCoverageCorrectionArgs([
        "--snapshot",
        "/tmp/snapshot.json",
        "--sql-out",
        "/tmp/out.sql",
        "--rollback-out",
        "/tmp/rollback.sql",
      ])
    ).toEqual({
      snapshotPath: "/tmp/snapshot.json",
      sqlOutPath: "/tmp/out.sql",
      rollbackOutPath: "/tmp/rollback.sql",
      manifestOutPath: undefined,
    })

    expect(
      parseBroadCoverageCorrectionArgs([
        "--snapshot",
        "/tmp/snapshot.json",
        "--sql-out",
        "/tmp/out.sql",
        "--rollback-out",
        "/tmp/rollback.sql",
        "--manifest-out",
        "/tmp/manifest.json",
      ])
    ).toEqual({
      snapshotPath: "/tmp/snapshot.json",
      sqlOutPath: "/tmp/out.sql",
      rollbackOutPath: "/tmp/rollback.sql",
      manifestOutPath: "/tmp/manifest.json",
    })
  })
})

describe("broad coverage correction manifest", () => {
  it("records hashes, guardrails, and exact correction scope for generated SQL", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: productionSnapshot,
    })
    const applySql = buildBroadCoverageCorrectionSql(plan)
    const rollbackSql = buildBroadCoverageRollbackSql(plan)

    const manifest = buildBroadCoverageCorrectionManifest({
      plan,
      applySql,
      rollbackSql,
      applySqlPath: "/tmp/apply.sql",
      rollbackSqlPath: "/tmp/rollback.sql",
      generatedAt: "2026-07-08T13:00:00.000Z",
    })

    expect(manifest).toMatchObject({
      schemaVersion: "careconnect-broad-coverage-correction-manifest-v1",
      mode: "dry-run-sql-prep",
      writesEnabled: false,
      generatedAt: "2026-07-08T13:00:00.000Z",
      summary: {
        productionRowsRead: 4,
        corrections: 3,
        provincial: 1,
        national: 2,
      },
      ids: ["ontario-211-ontario", "kids-help-phone", "ontario-naseeha"],
      artifacts: {
        applySql: {
          path: "/tmp/apply.sql",
          bytes: Buffer.byteLength(applySql),
          sha256: createHash("sha256").update(applySql).digest("hex"),
        },
        rollbackSql: {
          path: "/tmp/rollback.sql",
          bytes: Buffer.byteLength(rollbackSql),
          sha256: createHash("sha256").update(rollbackSql).digest("hex"),
        },
      },
    })

    expect(manifest.guardrails.applySql).toEqual({
      hasBegin: true,
      hasCommit: true,
      targetsPublicServices: true,
      setColumns: ["scope", "primary_place_id", "coverage"],
      disallowedSetColumnsPresent: [],
      mentionsBramptonIds: false,
      hasExactAssertion: true,
    })
    expect(manifest.guardrails.rollbackSql).toEqual({
      hasBegin: true,
      hasCommit: true,
      targetsPublicServices: true,
      setColumns: ["scope", "primary_place_id", "coverage"],
      disallowedSetColumnsPresent: [],
      mentionsBramptonIds: false,
      hasExactAssertion: true,
    })
  })
})

describe("broad coverage correction manifest verifier", () => {
  it("accepts SQL files that match the reviewed manifest", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: productionSnapshot,
    })
    const applySql = buildBroadCoverageCorrectionSql(plan)
    const rollbackSql = buildBroadCoverageRollbackSql(plan)
    const manifest = buildBroadCoverageCorrectionManifest({
      plan,
      applySql,
      rollbackSql,
      applySqlPath: "/tmp/apply.sql",
      rollbackSqlPath: "/tmp/rollback.sql",
      generatedAt: "2026-07-08T13:00:00.000Z",
    })

    expect(
      verifyBroadCoverageCorrectionManifest({
        manifest,
        applySql,
        rollbackSql,
      })
    ).toEqual({
      ok: true,
      failures: [],
      checked: {
        ids: 3,
        applySqlSha256Matches: true,
        rollbackSqlSha256Matches: true,
        applyGuardrailsMatch: true,
        rollbackGuardrailsMatch: true,
        writesEnabledFalse: true,
      },
    })
  })

  it("rejects SQL that no longer matches the reviewed manifest hash", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: productionSnapshot,
    })
    const applySql = buildBroadCoverageCorrectionSql(plan)
    const rollbackSql = buildBroadCoverageRollbackSql(plan)
    const manifest = buildBroadCoverageCorrectionManifest({
      plan,
      applySql,
      rollbackSql,
      applySqlPath: "/tmp/apply.sql",
      rollbackSqlPath: "/tmp/rollback.sql",
    })

    const result = verifyBroadCoverageCorrectionManifest({
      manifest,
      applySql: `${applySql}\n-- tampered`,
      rollbackSql,
    })

    expect(result.ok).toBe(false)
    expect(result.failures).toContain("Apply SQL SHA-256 mismatch")
    expect(result.checked.applySqlSha256Matches).toBe(false)
  })

  it("rejects manifests that are not marked as dry-run only", () => {
    const plan = buildBroadCoverageCorrectionPlan({
      services,
      productionRows: productionSnapshot,
    })
    const applySql = buildBroadCoverageCorrectionSql(plan)
    const manifest = buildBroadCoverageCorrectionManifest({
      plan,
      applySql,
      applySqlPath: "/tmp/apply.sql",
    })
    const unsafeManifest = { ...manifest, writesEnabled: true } as unknown as typeof manifest

    const result = verifyBroadCoverageCorrectionManifest({
      manifest: unsafeManifest,
      applySql,
    })

    expect(result.ok).toBe(false)
    expect(result.failures).toContain("Manifest writesEnabled must be false")
    expect(result.checked.writesEnabledFalse).toBe(false)
  })

  it("parses verification arguments", () => {
    expect(() => parseBroadCoverageVerificationArgs([])).toThrow("--manifest is required")
    expect(() => parseBroadCoverageVerificationArgs(["--manifest"])).toThrow("--manifest requires a value")
    expect(() => parseBroadCoverageVerificationArgs(["--manifest", "/tmp/manifest.json", "--apply"])).toThrow(
      "Unknown argument: --apply"
    )
    expect(parseBroadCoverageVerificationArgs(["--manifest", "/tmp/manifest.json"])).toEqual({
      manifestPath: "/tmp/manifest.json",
    })
  })
})
