#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"

interface Service {
  id: string
  name: string
  url?: string
}

interface HealthCheckResult {
  serviceId: string
  serviceName: string
  url: string
  status: number | "error"
  errorMessage?: string
  responseTime?: number
}

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")
const REPORT_PATH = path.join(process.cwd(), "data/url-health-report.json")

// Colors for console output
const RED = "\x1b[31m"
const GREEN = "\x1b[32m"
const YELLOW = "\x1b[33m"
const RESET = "\x1b[0m"

async function checkUrl(
  url: string
): Promise<{ status: number | "error"; errorMessage?: string; responseTime: number }> {
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

    let response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KingstonCareConnect-HealthCheck/1.0; +https://kingstoncare.vercel.app)",
      },
    })

    // Some servers reject HEAD, try GET if HEAD fails with 405, 404, or 403
    if (!response.ok && [405, 404, 403].includes(response.status)) {
      const controllerGet = new AbortController()
      const timeoutGet = setTimeout(() => controllerGet.abort(), 15000)
      response = await fetch(url, {
        method: "GET",
        signal: controllerGet.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; KingstonCareConnect-HealthCheck/1.0; +https://kingstoncare.vercel.app)",
        },
      })
      clearTimeout(timeoutGet)
    }

    clearTimeout(timeout)
    return {
      status: response.status,
      responseTime: Date.now() - start,
    }
  } catch (error) {
    return {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      responseTime: Date.now() - start,
    }
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
    const result = await checkUrl(service.url!)
    results.push({
      serviceId: service.id,
      serviceName: service.name,
      url: service.url!,
      ...result,
    })

    checked++
    const isOk = result.status === 200 || (typeof result.status === "number" && result.status < 400)
    const statusIcon = isOk
      ? `${GREEN}✅${RESET}`
      : result.status === "error"
      ? `${RED}❌${RESET}`
      : `${YELLOW}⚠️${RESET}`

    // Using a more readable multi-line output for CI/Terminal
    console.log(
      `${statusIcon} [${checked}/${servicesWithUrls.length}] ${service.name}: ${
        result.status === "error" ? result.errorMessage : `HTTP ${result.status}`
      } (${result.responseTime}ms)`
    )

    // Rate limiting: 500ms between requests to avoid being blocked
    if (checked < servicesWithUrls.length) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  console.log(`\n${YELLOW}📊 Results Summary:${RESET}\n`)

  const healthy = results.filter((r) => typeof r.status === "number" && r.status < 400)
  const broken = results.filter((r) => r.status === "error" || (typeof r.status === "number" && r.status >= 400))
  const redirects = results.filter((r) => typeof r.status === "number" && r.status >= 300 && r.status < 400)

  console.log(`  ${GREEN}✅ Healthy:${RESET} ${healthy.length}`)
  console.log(`  ${YELLOW}🔀 Redirects:${RESET} ${redirects.length}`)
  console.log(`  ${RED}❌ Broken:${RESET} ${broken.length}`)

  if (broken.length > 0) {
    console.log(`\n${RED}❌ Broken URLs:${RESET}\n`)
    for (const result of broken) {
      console.log(`  - ${result.serviceName}`)
      console.log(`    URL: ${result.url}`)
      console.log(`    Error: ${result.errorMessage || `HTTP ${result.status}`}\n`)
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
          broken: broken.length,
        },
        broken,
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
