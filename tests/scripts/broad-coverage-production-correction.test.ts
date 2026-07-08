/** @vitest-environment node */
import { describe, expect, it } from "vitest"

import servicesRaw from "@/data/services.json"
import {
  BROAD_COVERAGE_CORRECTION_APPROVAL_TOKEN,
  buildBroadCoverageCorrectionPlan,
  buildBroadCoverageRollbackSql,
  buildBroadCoverageCorrectionSql,
  type ProductionCoverageRow,
} from "@/scripts/lib/broad-coverage-production-correction"
import { parseBroadCoverageCorrectionArgs } from "@/scripts/prepare-broad-coverage-production-correction"
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
  })

  it("parses dry-run preparation arguments", () => {
    expect(parseBroadCoverageCorrectionArgs(["--snapshot", "/tmp/snapshot.json", "--sql-out", "/tmp/out.sql"])).toEqual(
      {
        snapshotPath: "/tmp/snapshot.json",
        sqlOutPath: "/tmp/out.sql",
        rollbackOutPath: undefined,
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
    })
  })
})
