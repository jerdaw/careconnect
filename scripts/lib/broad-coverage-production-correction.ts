import type { Service, ServiceCoverageArea, ServiceScope } from "../../types/service"

export const BROAD_COVERAGE_CORRECTION_APPROVAL_TOKEN = "I_APPROVE_FIXING_BROAD_COVERAGE_ONLY"

export type ProductionCoverageRow = {
  id: string
  scope: ServiceScope | null
  primary_place_id: string | null
  coverage: ServiceCoverageArea[] | null
}

export type BroadCoverageTarget = {
  scope: ServiceScope
  primary_place_id: Service["primary_place_id"] | null
  coverage: ServiceCoverageArea[]
}

export type BroadCoverageCorrection = {
  id: string
  before: ProductionCoverageRow
  after: BroadCoverageTarget
}

export type BroadCoverageCorrectionPlan = {
  corrections: BroadCoverageCorrection[]
  summary: {
    productionRowsRead: number
    corrections: number
    provincial: number
    national: number
  }
}

function deriveBroadTarget(service: Service): BroadCoverageTarget | null {
  const explicitBroadCoverage = (service.coverage ?? []).filter(
    (area) => area.kind === "provincial" || area.kind === "national"
  )

  if (explicitBroadCoverage.length > 0) {
    return {
      scope: service.scope === "canada" ? "canada" : "ontario",
      primary_place_id: service.primary_place_id ?? null,
      coverage: explicitBroadCoverage,
    }
  }

  if (service.scope === "ontario") {
    return {
      scope: "ontario",
      primary_place_id: null,
      coverage: [{ kind: "provincial", label: "Ontario-wide" }],
    }
  }

  if (service.scope === "canada") {
    return {
      scope: "canada",
      primary_place_id: null,
      coverage: [{ kind: "national", label: "Canada-wide" }],
    }
  }

  return null
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableJson(nestedValue)}`)
      .join(",")}}`
  }

  return JSON.stringify(value)
}

function needsCorrection(row: ProductionCoverageRow, target: BroadCoverageTarget): boolean {
  return (
    row.scope !== target.scope ||
    row.primary_place_id !== target.primary_place_id ||
    stableJson(row.coverage ?? null) !== stableJson(target.coverage)
  )
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function sqlNullableString(value: string | null | undefined): string {
  return value ? sqlString(value) : "null"
}

function sqlJsonb(value: unknown): string {
  return `${sqlString(JSON.stringify(value))}::jsonb`
}

function sqlNullableJsonb(value: unknown): string {
  return value === null || value === undefined ? "null::jsonb" : sqlJsonb(value)
}

function buildValues(
  corrections: BroadCoverageCorrection[],
  selectTarget: (correction: BroadCoverageCorrection) => {
    scope: string | null | undefined
    primary_place_id: string | null | undefined
    coverage: ServiceCoverageArea[] | null | undefined
  }
): string {
  return corrections
    .map((item) => {
      const target = selectTarget(item)
      return `(${sqlString(item.id)}::text, ${sqlNullableString(target.scope)}::text, ${sqlNullableString(
        target.primary_place_id
      )}::text, ${sqlNullableJsonb(target.coverage)})`
    })
    .join(",\n    ")
}

export function buildBroadCoverageCorrectionPlan(input: {
  services: Service[]
  productionRows: ProductionCoverageRow[]
}): BroadCoverageCorrectionPlan {
  const serviceById = new Map(input.services.map((service) => [service.id, service]))
  const corrections = input.productionRows.flatMap((row): BroadCoverageCorrection[] => {
    const service = serviceById.get(row.id)
    if (!service) return []

    const target = deriveBroadTarget(service)
    if (!target) return []
    if (!needsCorrection(row, target)) return []

    return [{ id: row.id, before: row, after: target }]
  })

  return {
    corrections,
    summary: {
      productionRowsRead: input.productionRows.length,
      corrections: corrections.length,
      provincial: corrections.filter((item) => item.after.scope === "ontario").length,
      national: corrections.filter((item) => item.after.scope === "canada").length,
    },
  }
}

export function buildBroadCoverageCorrectionSql(plan: BroadCoverageCorrectionPlan): string {
  if (plan.corrections.length === 0) {
    throw new Error("No broad coverage corrections to write")
  }

  const values = buildValues(plan.corrections, (item) => item.after)

  return `begin;

with updates(id, scope, primary_place_id, coverage) as (
  values
    ${values}
),
updated as (
  update public.services
  set
    scope = updates.scope,
    primary_place_id = updates.primary_place_id,
    coverage = updates.coverage
  from updates
  where services.id = updates.id
  returning services.id
)
select count(*)::int as updated_rows from updated;

do $$
declare
  matched_count integer;
begin
  with updates(id, scope, primary_place_id, coverage) as (
    values
      ${values}
  )
  select count(*) into matched_count
  from public.services
  join updates on services.id = updates.id
  where services.scope is not distinct from updates.scope
    and services.primary_place_id is not distinct from updates.primary_place_id
    and services.coverage = updates.coverage;

  if matched_count <> ${plan.corrections.length} then
    raise exception 'Expected to update exactly ${plan.corrections.length} broad coverage rows, matched % after update', matched_count;
  end if;
end $$;

commit;
`
}

export function buildBroadCoverageRollbackSql(plan: BroadCoverageCorrectionPlan): string {
  if (plan.corrections.length === 0) {
    throw new Error("No broad coverage corrections to roll back")
  }

  const values = buildValues(plan.corrections, (item) => item.before)

  return `begin;

with updates(id, scope, primary_place_id, coverage) as (
  values
    ${values}
),
updated as (
  update public.services
  set
    scope = updates.scope,
    primary_place_id = updates.primary_place_id,
    coverage = updates.coverage
  from updates
  where services.id = updates.id
  returning services.id
)
select count(*)::int as rolled_back_rows from updated;

do $$
declare
  matched_count integer;
begin
  with updates(id, scope, primary_place_id, coverage) as (
    values
      ${values}
  )
  select count(*) into matched_count
  from public.services
  join updates on services.id = updates.id
  where services.scope is not distinct from updates.scope
    and services.primary_place_id is not distinct from updates.primary_place_id
    and services.coverage is not distinct from updates.coverage;

  if matched_count <> ${plan.corrections.length} then
    raise exception 'Expected to roll back exactly ${plan.corrections.length} broad coverage rows, matched % after rollback', matched_count;
  end if;
end $$;

commit;
`
}
