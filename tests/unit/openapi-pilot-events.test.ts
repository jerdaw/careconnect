import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"

const openApi = readFileSync(join(process.cwd(), "docs/api/openapi.yaml"), "utf8")
const pilotRouteRoot = join(process.cwd(), "app/api/v1/pilot")

type ImplementedPilotRoute = {
  path: string
  methods: string[]
}

type ComponentKind = "schemas" | "responses"

function collectRouteFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      return collectRouteFiles(entryPath)
    }

    return entry.isFile() && entry.name === "route.ts" ? [entryPath] : []
  })
}

function routeFileToOpenApiPath(routeFile: string): string {
  const routeSegments = routeFile
    .slice(pilotRouteRoot.length + 1)
    .split(/[\\/]/)
    .slice(0, -1)
    .map((segment) => {
      if (segment.startsWith("[") && segment.endsWith("]")) {
        return `{${segment.slice(1, -1)}}`
      }

      return segment
    })

  return `/pilot/${routeSegments.join("/")}`
}

function routeFileMethods(routeFile: string): string[] {
  const source = readFileSync(routeFile, "utf8")
  const methods: string[] = []

  for (const match of source.matchAll(/\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)) {
    const method = match[1]
    if (method) {
      methods.push(method.toLowerCase())
    }
  }

  if (methods.length === 0) {
    throw new Error(`No exported HTTP methods found in ${routeFile}`)
  }

  return [...new Set(methods)].sort()
}

function implementedPilotRoutes(): ImplementedPilotRoute[] {
  return collectRouteFiles(pilotRouteRoot)
    .map((routeFile) => ({
      path: routeFileToOpenApiPath(routeFile),
      methods: routeFileMethods(routeFile),
    }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

function documentedPilotPaths(): string[] {
  const paths: string[] = []

  for (const match of openApi.matchAll(/^  (\/pilot\/[^:\n]+):/gm)) {
    const path = match[1]
    if (path) {
      paths.push(path)
    }
  }

  return paths.sort()
}

function documentedPilotMethods(path: string): string[] {
  const methods: string[] = []

  for (const match of pathSection(path).matchAll(/^    (get|post|put|patch|delete|head|options):$/gm)) {
    const method = match[1]
    if (method) {
      methods.push(method)
    }
  }

  return methods.sort()
}

function componentSection(kind: ComponentKind): string {
  const componentsStart = openApi.indexOf("\ncomponents:")
  expect(componentsStart).toBeGreaterThanOrEqual(0)

  const marker = `\n  ${kind}:`
  const start = openApi.indexOf(marker, componentsStart)
  expect(start).toBeGreaterThanOrEqual(0)

  const rest = openApi.slice(start + marker.length)
  const nextComponentKind = /\n  [A-Za-z][A-Za-z0-9]*:/.exec(rest)
  const end = nextComponentKind ? start + marker.length + nextComponentKind.index : undefined

  return openApi.slice(start, end)
}

function componentNames(kind: ComponentKind): string[] {
  return [...componentSection(kind).matchAll(/\n    ([A-Za-z][A-Za-z0-9]*):/g)]
    .map(([, name]) => name)
    .filter((name): name is string => Boolean(name))
    .sort()
}

function localComponentRefs(): Array<{ kind: ComponentKind; name: string }> {
  const refsByKey = new Map<string, { kind: ComponentKind; name: string }>()

  for (const match of openApi.matchAll(/\$ref:\s+"#\/components\/(schemas|responses)\/([A-Za-z][A-Za-z0-9]*)"/g)) {
    const kind = match[1] as ComponentKind | undefined
    const name = match[2]

    if (kind && name) {
      refsByKey.set(`${kind}/${name}`, { kind, name })
    }
  }

  return [...refsByKey.values()].sort((a, b) => `${a.kind}/${a.name}`.localeCompare(`${b.kind}/${b.name}`))
}

function pathSection(path: string): string {
  const marker = `  ${path}:`
  const start = openApi.indexOf(marker)
  expect(start).toBeGreaterThanOrEqual(0)

  const nextPath = openApi.indexOf("\n  /", start + marker.length)
  return openApi.slice(start, nextPath === -1 ? undefined : nextPath)
}

function operationSection(path: string, method: string): string {
  const section = pathSection(path)
  const marker = `\n    ${method}:`
  const start = section.indexOf(marker)
  expect(start).toBeGreaterThanOrEqual(0)

  const rest = section.slice(start + marker.length)
  const nextMethod = /\n    (get|post|put|patch|delete|head|options):/.exec(rest)
  const end = nextMethod ? start + marker.length + nextMethod.index : undefined

  return section.slice(start, end)
}

function operationId(path: string, method: string): string {
  const match = /\n      operationId: ([A-Za-z][A-Za-z0-9]*)\n/.exec(operationSection(path, method))
  expect(match?.[1]).toBeDefined()

  return match?.[1] ?? ""
}

function schemaSection(schemaName: string): string {
  const marker = `    ${schemaName}:`
  const start = openApi.indexOf(marker)
  expect(start).toBeGreaterThanOrEqual(0)

  const rest = openApi.slice(start + marker.length)
  const nextSchemaMatch = /\n    [A-Za-z0-9]+:/.exec(rest)
  const end = nextSchemaMatch ? start + marker.length + nextSchemaMatch.index : undefined

  return openApi.slice(start, end)
}

describe("OpenAPI pilot contract", () => {
  const pilotRoutes = implementedPilotRoutes()
  const pilotPaths = pilotRoutes.map(({ path }) => path)
  const pilotMethods = pilotRoutes.flatMap(({ path, methods }) => methods.map((method) => [method, path] as const))
  const pilotJsonWriteOperations = pilotMethods.filter(([method]) => method !== "get")
  const componentsByKind = {
    responses: componentNames("responses"),
    schemas: componentNames("schemas"),
  } satisfies Record<ComponentKind, string[]>

  it.each(localComponentRefs())("resolves local OpenAPI component ref #/components/$kind/$name", ({ kind, name }) => {
    expect(componentsByKind[kind]).toContain(name)
  })

  it("documents exactly the implemented pilot route paths", () => {
    expect(documentedPilotPaths()).toEqual(pilotPaths)
  })

  it.each(pilotPaths)("documents implemented pilot route %s", (path) => {
    expect(pathSection(path)).toContain(path)
  })

  it.each(pilotMethods)("documents implemented pilot method %s %s", (method, path) => {
    expect(pathSection(path)).toContain(`\n    ${method}:`)
  })

  it.each(pilotRoutes)("documents exactly the implemented pilot methods for $path", ({ path, methods }) => {
    expect(documentedPilotMethods(path)).toEqual(methods)
  })

  it.each(pilotMethods)("documents cookie auth for implemented pilot operation %s %s", (method, path) => {
    expect(operationSection(path, method)).toContain("\n      security:\n        - cookieAuth: []")
  })

  it.each(pilotMethods)("documents an operationId for implemented pilot operation %s %s", (method, path) => {
    expect(operationId(path, method)).toMatch(/^[A-Za-z][A-Za-z0-9]*$/)
  })

  it("uses unique pilot operationIds", () => {
    const operationIds = pilotMethods.map(([method, path]) => operationId(path, method))

    expect(new Set(operationIds).size).toBe(operationIds.length)
  })

  const eventPaths = [
    "/pilot/events/contact-attempt",
    "/pilot/events/referral",
    "/pilot/events/connection",
    "/pilot/events/service-status",
    "/pilot/events/data-decay-audit",
    "/pilot/events/preference-fit",
  ]

  it.each(eventPaths)("documents supplied-id duplicate responses for %s", (path) => {
    const section = pathSection(path)

    expect(section).toContain('"200":')
    expect(section).toContain("Idempotent retry accepted")
    expect(section).toContain("#/components/schemas/PilotWriteSuccess")
    expect(section).toContain('"201":')
  })

  it.each(pilotJsonWriteOperations)("documents JSON request bodies for pilot write operation %s %s", (method, path) => {
    const section = operationSection(path, method)

    expect(section).toContain("\n      requestBody:")
    expect(section).toContain("\n          application/json:")
  })

  it.each(pilotJsonWriteOperations)(
    "documents unsupported media type responses for pilot write operation %s %s",
    (method, path) => {
      const section = operationSection(path, method)

      expect(section).toContain('"415":')
      expect(section).toContain("request body must be application/json")
    }
  )

  const createSchemas = [
    "PilotContactAttemptCreate",
    "PilotReferralCreate",
    "PilotConnectionCreate",
    "PilotServiceStatusCreate",
    "PilotDataDecayAuditCreate",
    "PilotPreferenceFitCreate",
  ]

  it.each(createSchemas)("documents optional client event id for %s", (schemaName) => {
    const section = schemaSection(schemaName)

    expect(section).toContain("id:")
    expect(section).toContain("format: uuid")
    expect(section).toContain("Optional client-generated event id for idempotent offline retries.")
  })

  it("documents duplicate retry payload shape", () => {
    const section = schemaSection("PilotWriteSuccess")

    expect(section).toContain("success:")
    expect(section).toContain("duplicate:")
    expect(section).toContain("supplied client event id was already recorded")
  })

  it("documents pilot update and decision success envelopes", () => {
    const referralUpdate = pathSection("/pilot/events/referral/{id}")
    const integrationDecision = pathSection("/pilot/integration-feasibility")

    expect(referralUpdate).toContain("operationId: updatePilotReferralEvent")
    expect(referralUpdate).toContain('"200":')
    expect(referralUpdate).toContain("#/components/schemas/PilotWriteSuccess")

    expect(integrationDecision).toContain("operationId: recordIntegrationFeasibilityDecision")
    expect(integrationDecision).toContain('"201":')
    expect(integrationDecision).toContain("#/components/schemas/PilotWriteSuccess")
  })

  it("documents the privacy-safe pilot service scope endpoint", () => {
    const path = pathSection("/pilot/scope/services")
    const schema = schemaSection("PilotServiceScopeCreate")

    expect(path).toContain("operationId: upsertPilotServiceScope")
    expect(path).toContain("#/components/schemas/PilotServiceScopeCreate")
    expect(path).toContain('"201":')
    expect(path).not.toContain('"200":')

    expect(schema).toContain("pilot_cycle_id:")
    expect(schema).toContain("org_id:")
    expect(schema).toContain("service_id:")
    expect(schema).toContain("sla_tier:")
    expect(schema).toContain("enum: [crisis, high_demand, standard]")
    expect(schema).toContain("Raw query text, client identifiers, and contact fields are not accepted.")
  })

  it("documents the pilot metrics recompute endpoint", () => {
    const path = pathSection("/pilot/metrics/recompute")
    const requestSchema = schemaSection("PilotMetricsRecomputeRequest")
    const resultSchema = schemaSection("PilotMetricsRecomputeResult")

    expect(path).toContain("operationId: recomputePilotMetrics")
    expect(path).toContain("#/components/schemas/PilotMetricsRecomputeRequest")
    expect(path).toContain("#/components/schemas/PilotMetricsRecomputeResult")
    expect(path).toContain('"200":')
    expect(path).toContain('"501":')

    expect(requestSchema).toContain("pilot_cycle_id:")
    expect(requestSchema).toContain("org_id:")
    expect(requestSchema).toContain("format: uuid")
    expect(requestSchema).toContain("Raw query text, client identifiers, and contact fields are not accepted.")

    expect(resultSchema).toContain("success:")
    expect(resultSchema).toContain("calculatedAt:")
    expect(resultSchema).toContain("snapshotsWritten:")
    expect(resultSchema).toContain("#/components/schemas/PilotScorecard")
  })

  it("documents the pilot scorecard response and not-found status", () => {
    const path = pathSection("/pilot/metrics/scorecard")
    const responseSchema = schemaSection("PilotScorecardResponse")
    const gateEvaluationSchema = schemaSection("Gate1ThresholdEvaluation")

    expect(path).toContain("operationId: getPilotScorecard")
    expect(path).toContain("#/components/schemas/PilotScorecardResponse")
    expect(path).toContain('"404":')
    expect(path).toContain("Pilot scorecard not found")

    expect(responseSchema).toContain("scorecard:")
    expect(responseSchema).toContain("#/components/schemas/PilotScorecard")
    expect(responseSchema).toContain("gate1Evaluation:")
    expect(responseSchema).toContain("#/components/schemas/Gate1ThresholdEvaluation")

    expect(gateEvaluationSchema).toContain("failedContactRateReductionPass:")
    expect(gateEvaluationSchema).toContain("timeToConnectionReductionPass:")
    expect(gateEvaluationSchema).toContain("freshnessSlaPass:")
    expect(gateEvaluationSchema).toContain("referralCapturePass:")
    expect(gateEvaluationSchema).toContain("fatalErrorRatePass:")
    expect(gateEvaluationSchema).toContain("passedAll:")
  })
})
