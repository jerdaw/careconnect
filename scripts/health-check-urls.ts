#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"

import { classifyUrlCheckOutcome, type UrlCheckOutcome, type UrlHealthClassification } from "@/lib/health/url-health"
import { resolveUrlHealthProbe, type UrlHealthProbeSource } from "@/lib/health/url-health-probes"

interface Service {
  id: string
  name: string
  url?: string
}

interface HealthCheckResult extends UrlCheckOutcome {
  serviceId: string
  serviceName: string
  url: string
  probeUrl: string
  probeSource: UrlHealthProbeSource
  probeReason?: string
  classification: UrlHealthClassification
  finalUrl?: string
  responseTime?: number
  notes?: string
}

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")
const REPORT_PATH = path.join(process.cwd(), "data/url-health-report.json")
const USER_AGENT = "Mozilla/5.0 (compatible; CareConnect-URLHealthCheck/1.0; +https://careconnect.ing)"
const REQUEST_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-CA,en;q=0.9",
}
const REQUEST_TIMEOUT_MS = 15000
const RETRY_COUNT = 2

// Colors for console output
const RED = "\x1b[31m"
const GREEN = "\x1b[32m"
const YELLOW = "\x1b[33m"
const RESET = "\x1b[0m"

async function fetchUrl(url: string, method: "HEAD" | "GET"): Promise<UrlCheckOutcome & { finalUrl?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const start = Date.now()

  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: REQUEST_HEADERS,
    })

    clearTimeout(timeout)
    return {
      status: response.status,
      finalUrl: response.url,
      errorMessage: response.status >= 400 ? `HTTP ${response.status}` : undefined,
    }
  } catch (error) {
    const errorCause =
      error instanceof Error && "cause" in error ? (error.cause as { code?: string; message?: string }) : {}

    clearTimeout(timeout)
    return {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorCode: errorCause.code,
    }
  } finally {
    if (Date.now() - start > REQUEST_TIMEOUT_MS) {
      clearTimeout(timeout)
    }
  }
}

async function checkUrl(
  url: string
): Promise<
  Pick<HealthCheckResult, "status" | "errorCode" | "errorMessage" | "finalUrl" | "responseTime" | "classification">
> {
  const start = Date.now()
  let latestResult: UrlCheckOutcome & { finalUrl?: string } = { status: "error", errorMessage: "No result returned" }

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    const headResult = await fetchUrl(url, "HEAD")
    const candidateResult =
      headResult.status === "error" || (typeof headResult.status === "number" && headResult.status >= 400)
        ? await fetchUrl(url, "GET")
        : headResult

    latestResult = candidateResult

    const classification = classifyUrlCheckOutcome(candidateResult)
    if (classification !== "inconclusive" || attempt === RETRY_COUNT) {
      return {
        ...candidateResult,
        classification,
        responseTime: Date.now() - start,
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
  }

  return {
    ...latestResult,
    classification: classifyUrlCheckOutcome(latestResult),
    responseTime: Date.now() - start,
  }
}

function formatOutcome(outcome: Pick<HealthCheckResult, "status" | "errorCode" | "errorMessage">): string {
  if (outcome.status === "error") {
    return `${outcome.errorCode ? `${outcome.errorCode}: ` : ""}${outcome.errorMessage}`
  }

  return `HTTP ${outcome.status}`
}

async function checkService(service: Service): Promise<HealthCheckResult> {
  const primaryResult = await checkUrl(service.url!)
  const probe = resolveUrlHealthProbe(service.id, service.url!)

  if (primaryResult.classification !== "inconclusive" || probe.source === "service_url") {
    return {
      serviceId: service.id,
      serviceName: service.name,
      url: service.url!,
      probeUrl: service.url!,
      probeSource: "service_url",
      ...primaryResult,
    }
  }

  const overrideResult = await checkUrl(probe.probeUrl)
  if (overrideResult.classification === "healthy") {
    return {
      serviceId: service.id,
      serviceName: service.name,
      url: service.url!,
      probeUrl: probe.probeUrl,
      probeSource: probe.source,
      probeReason: probe.reason,
      ...overrideResult,
      notes: `Primary URL remained inconclusive (${formatOutcome(primaryResult)}); official override probe succeeded.`,
    }
  }

  return {
    serviceId: service.id,
    serviceName: service.name,
    url: service.url!,
    probeUrl: service.url!,
    probeSource: "service_url",
    ...primaryResult,
    notes: `Official override probe (${probe.probeUrl}) was ${formatOutcome(overrideResult)}.`,
  }
}

async function main() {
  console.log(`${YELLOW}🔗 Running URL health check...${RESET}\n`)

  if (!existsSync(SERVICES_PATH)) {
    console.error(`${RED}❌ Services file not found at ${SERVICES_PATH}${RESET}`)
    process.exit(1)
  }

  const services: Service[] = JSON.parse(readFileSync(SERVICES_PATH, "utf-8")) as Service[]
  const servicesWithUrls = services.filter((s) => s.url)

  console.log(`Found ${servicesWithUrls.length} services with URLs\n`)

  const results: HealthCheckResult[] = []
  let checked = 0

  for (const service of servicesWithUrls) {
    const result = await checkService(service)
    results.push(result)

    checked++
    const statusIcon =
      result.classification === "healthy"
        ? `${GREEN}✅${RESET}`
        : result.classification === "broken"
          ? `${RED}❌${RESET}`
          : `${YELLOW}⚠️${RESET}`
    const statusText =
      result.status === "error"
        ? `${result.errorCode ? `${result.errorCode}: ` : ""}${result.errorMessage}`
        : `HTTP ${result.status}${result.finalUrl && result.finalUrl !== result.probeUrl ? ` → ${result.finalUrl}` : ""}`
    const probeText =
      result.probeSource === "official_override"
        ? ` via override ${result.probeUrl}${result.probeReason ? ` (${result.probeReason})` : ""}`
        : ""
    const notesText = result.notes ? ` ${result.notes}` : ""

    // Using a more readable multi-line output for CI/Terminal
    console.log(
      `${statusIcon} [${checked}/${servicesWithUrls.length}] ${service.name}: ${statusText}${probeText}${notesText} (${result.responseTime}ms)`
    )

    // Rate limiting: 500ms between requests to avoid being blocked
    if (checked < servicesWithUrls.length) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  console.log(`\n${YELLOW}📊 Results Summary:${RESET}\n`)

  const healthy = results.filter((result) => result.classification === "healthy")
  const broken = results.filter((result) => result.classification === "broken")
  const inconclusive = results.filter((result) => result.classification === "inconclusive")
  const redirects = results.filter((r) => typeof r.status === "number" && r.status >= 300 && r.status < 400)

  console.log(`  ${GREEN}✅ Healthy:${RESET} ${healthy.length}`)
  console.log(`  ${YELLOW}🔀 Redirects:${RESET} ${redirects.length}`)
  console.log(`  ${YELLOW}⚠️ Inconclusive:${RESET} ${inconclusive.length}`)
  console.log(`  ${RED}❌ Broken:${RESET} ${broken.length}`)

  if (broken.length > 0) {
    console.log(`\n${RED}❌ Broken URLs:${RESET}\n`)
    for (const result of broken) {
      console.log(`  - ${result.serviceName}`)
      console.log(`    URL: ${result.url}`)
      if (result.probeSource === "official_override") {
        console.log(`    Override Probe: ${result.probeUrl}`)
      }
      console.log(`    Error: ${result.errorMessage || `HTTP ${result.status}`}\n`)
    }
  }

  if (inconclusive.length > 0) {
    console.log(`\n${YELLOW}⚠️ Inconclusive URLs (manual review only if this persists):${RESET}\n`)
    for (const result of inconclusive) {
      console.log(`  - ${result.serviceName}`)
      console.log(`    URL: ${result.url}`)
      if (result.probeSource === "official_override") {
        console.log(`    Override Probe: ${result.probeUrl}`)
      }
      console.log(
        `    Result: ${
          result.status === "error"
            ? `${result.errorCode ? `${result.errorCode}: ` : ""}${result.errorMessage}`
            : `HTTP ${result.status}`
        }\n`
      )
    }
  }

  // Write report
  writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        summary: {
          total: results.length,
          healthy: healthy.length,
          redirects: redirects.length,
          inconclusive: inconclusive.length,
          broken: broken.length,
        },
        broken,
        inconclusive,
        redirects,
      },
      null,
      2
    )
  )

  console.log(`\n📝 Report saved to: ${REPORT_PATH}`)

  if (broken.length > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`${RED}Fatal error: ${err.message}${RESET}`)
  process.exit(1)
})
