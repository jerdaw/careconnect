import fs from "fs"
import path from "path"

export interface ValidationResult {
  passed: boolean
  issues: string[]
  warnings: string[]
}

export interface SecurityHeader {
  key: string
  value: string
}

interface CspDirectiveRule {
  name: string
  required: boolean
  expectedValue?: string
}

interface CspWarningRule {
  directive: string
  contains: string
  message: string
}

interface ExpectedHeaderConfig {
  required: boolean
  directives?: CspDirectiveRule[]
  warnings?: CspWarningRule[]
  expectedValue?: string
  allowedValues?: string[]
  mustContain?: string[]
  minMaxAge?: number
  shouldRestrictFeatures?: string[]
}

export interface SecurityHeaderCheck {
  headerName: string
  present: boolean
  result: ValidationResult
}

export interface SecurityHeadersReport {
  passed: boolean
  checks: SecurityHeaderCheck[]
  warnings: string[]
}

export interface RuntimeSecurityHeadersResult {
  path: string
  url: string
  status?: number
  passed: boolean
  report?: SecurityHeadersReport
  error?: string
}

export const DEFAULT_RUNTIME_SECURITY_HEADER_PATHS = ["/en", "/api/v1/health"] as const

export const EXPECTED_SECURITY_HEADERS: Record<string, ExpectedHeaderConfig> = {
  "Content-Security-Policy": {
    required: true,
    directives: [
      { name: "default-src", required: true },
      { name: "script-src", required: true },
      { name: "style-src", required: true },
      { name: "img-src", required: true },
      { name: "font-src", required: true },
      { name: "connect-src", required: true },
      { name: "frame-ancestors", required: true, expectedValue: "'none'" },
      { name: "base-uri", required: true },
      { name: "form-action", required: true },
    ],
    warnings: [
      {
        directive: "script-src",
        contains: "'unsafe-inline'",
        message: "script-src contains 'unsafe-inline' - consider using nonces for inline scripts",
      },
      {
        directive: "script-src",
        contains: "'unsafe-eval'",
        message: "script-src contains 'unsafe-eval' - required for WebLLM AI features",
      },
    ],
  },
  "X-Frame-Options": {
    required: true,
    expectedValue: "DENY",
  },
  "X-Content-Type-Options": {
    required: true,
    expectedValue: "nosniff",
  },
  "Referrer-Policy": {
    required: true,
    allowedValues: [
      "no-referrer",
      "no-referrer-when-downgrade",
      "origin",
      "origin-when-cross-origin",
      "same-origin",
      "strict-origin",
      "strict-origin-when-cross-origin",
      "unsafe-url",
    ],
  },
  "Strict-Transport-Security": {
    required: true,
    mustContain: ["max-age=", "includeSubDomains"],
    minMaxAge: 31536000,
  },
  "Permissions-Policy": {
    required: true,
    shouldRestrictFeatures: ["camera", "microphone"],
  },
}

function formatRuntimeFetchError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return [
    "Runtime security header target is unreachable.",
    "Start the app with `npm run dev` or set SECURITY_HEADERS_BASE_URL to a reachable deployment.",
    `Fetch error: ${message}`,
  ].join(" ")
}

export function parseCSP(csp: string): Map<string, string> {
  const directives = new Map<string, string>()
  const parts = csp.split(";").map((segment) => segment.trim())

  for (const part of parts) {
    if (!part) continue
    const [directive, ...values] = part.split(/\s+/)
    if (directive) {
      directives.set(directive, values.join(" "))
    }
  }

  return directives
}

export function validateCSP(cspValue: string): ValidationResult {
  const result: ValidationResult = { passed: true, issues: [], warnings: [] }
  const directives = parseCSP(cspValue)
  const cspConfig = EXPECTED_SECURITY_HEADERS["Content-Security-Policy"]!

  for (const { name, required, expectedValue } of cspConfig.directives || []) {
    if (required && !directives.has(name)) {
      result.passed = false
      result.issues.push(`Missing required CSP directive: ${name}`)
    }

    if (expectedValue && directives.get(name) !== expectedValue) {
      result.passed = false
      result.issues.push(`CSP directive ${name} should be exactly '${expectedValue}', got '${directives.get(name)}'`)
    }
  }

  for (const { directive, contains, message } of cspConfig.warnings || []) {
    const value = directives.get(directive)
    if (value && value.includes(contains)) {
      result.warnings.push(message)
    }
  }

  return result
}

export function validateHSTS(hstsValue: string): ValidationResult {
  const result: ValidationResult = { passed: true, issues: [], warnings: [] }
  const config = EXPECTED_SECURITY_HEADERS["Strict-Transport-Security"]!

  for (const required of config.mustContain || []) {
    if (!hstsValue.includes(required)) {
      result.passed = false
      result.issues.push(`HSTS missing required component: ${required}`)
    }
  }

  const maxAgeMatch = hstsValue.match(/max-age=(\d+)/)
  if (maxAgeMatch) {
    const maxAge = Number.parseInt(maxAgeMatch[1]!, 10)
    if (config.minMaxAge !== undefined && maxAge < config.minMaxAge) {
      result.passed = false
      result.issues.push(`HSTS max-age too short: ${maxAge} seconds (minimum: ${config.minMaxAge} = 1 year)`)
    }
  } else {
    result.passed = false
    result.issues.push("HSTS max-age not found or invalid")
  }

  return result
}

export function validatePermissionsPolicy(policyValue: string): ValidationResult {
  const result: ValidationResult = { passed: true, issues: [], warnings: [] }
  const config = EXPECTED_SECURITY_HEADERS["Permissions-Policy"]!

  for (const feature of config.shouldRestrictFeatures || []) {
    if (!policyValue.includes(`${feature}=(`)) {
      result.warnings.push(`Permissions-Policy should restrict feature: ${feature}`)
    }
  }

  return result
}

function validateHeaderValue(headerName: string, value: string): ValidationResult {
  const config = EXPECTED_SECURITY_HEADERS[headerName]
  if (!config) {
    return { passed: true, issues: [], warnings: [] }
  }

  if (headerName === "Content-Security-Policy") {
    return validateCSP(value)
  }

  if (headerName === "Strict-Transport-Security") {
    return validateHSTS(value)
  }

  if (headerName === "Permissions-Policy") {
    return validatePermissionsPolicy(value)
  }

  const result: ValidationResult = { passed: true, issues: [], warnings: [] }

  if (config.expectedValue && value !== config.expectedValue) {
    result.passed = false
    result.issues.push(`Expected value '${config.expectedValue}', got '${value}'`)
  }

  if (config.allowedValues && !config.allowedValues.includes(value)) {
    result.passed = false
    result.issues.push(`Value '${value}' not in allowed values: ${config.allowedValues.join(", ")}`)
  }

  return result
}

function findHeader(headers: SecurityHeader[], headerName: string): SecurityHeader | undefined {
  return headers.find((header) => header.key.toLowerCase() === headerName.toLowerCase())
}

export function validateSecurityHeaders(headers: SecurityHeader[]): SecurityHeadersReport {
  const checks: SecurityHeaderCheck[] = []
  let passed = true
  const warnings: string[] = []

  for (const [headerName, config] of Object.entries(EXPECTED_SECURITY_HEADERS)) {
    const header = findHeader(headers, headerName)

    if (!header) {
      const missingResult: ValidationResult = {
        passed: !config.required,
        issues: config.required ? ["Missing required header"] : [],
        warnings: [],
      }

      if (!missingResult.passed) {
        passed = false
      }

      checks.push({
        headerName,
        present: false,
        result: missingResult,
      })
      continue
    }

    const result = validateHeaderValue(headerName, header.value)
    if (!result.passed) {
      passed = false
    }
    warnings.push(...result.warnings.map((warning) => `${headerName}: ${warning}`))
    checks.push({
      headerName,
      present: true,
      result,
    })
  }

  return { passed, checks, warnings }
}

export function loadSecurityHeadersFromNextConfig(
  configPath = path.join(process.cwd(), "next.config.ts")
): SecurityHeader[] {
  if (!fs.existsSync(configPath)) {
    throw new Error(`next.config.ts not found at ${configPath}`)
  }

  const configContent = fs.readFileSync(configPath, "utf8")
  const arrayStartMatch = configContent.match(/const securityHeaders\s*=\s*\[/)

  if (!arrayStartMatch) {
    throw new Error("Could not find securityHeaders array in next.config.ts")
  }

  const arrayStart = arrayStartMatch.index! + arrayStartMatch[0].length
  let depth = 1
  let arrayEnd = arrayStart

  for (let i = arrayStart; i < configContent.length && depth > 0; i++) {
    if (configContent[i] === "[") depth++
    if (configContent[i] === "]") depth--
    arrayEnd = i
  }

  const arrayContent = configContent.substring(arrayStart, arrayEnd)
  const headers: SecurityHeader[] = []
  const objectRegex = /\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g
  let match: RegExpExecArray | null

  while ((match = objectRegex.exec(arrayContent)) !== null) {
    const objectContent = match[1] ?? ""
    const keyMatch = objectContent.match(/key:\s*["']([^"']+)["']/)
    if (!keyMatch) continue

    const key = keyMatch[1]!
    let value = ""

    const arrayJoinMatch = objectContent.match(/value:\s*\[([\s\S]*?)\]\.join\(["'][^"']*["']\)/)
    if (arrayJoinMatch) {
      value = arrayJoinMatch[1]!
        .split(",")
        .map((segment) => segment.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
        .join("; ")
    } else {
      const stringMatch = objectContent.match(/value:\s*["']([^"']*)["']/)
      if (stringMatch) {
        value = stringMatch[1]!
      }
    }

    headers.push({ key, value })
  }

  return headers
}

export async function validateRuntimeSecurityHeaders({
  baseUrl,
  paths = [...DEFAULT_RUNTIME_SECURITY_HEADER_PATHS],
  fetchImpl = fetch,
}: {
  baseUrl: string
  paths?: string[]
  fetchImpl?: typeof fetch
}): Promise<{ passed: boolean; results: RuntimeSecurityHeadersResult[] }> {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  const results: RuntimeSecurityHeadersResult[] = []
  let passed = true

  for (const rawPath of paths) {
    const pathValue = rawPath.startsWith("/") ? rawPath : `/${rawPath}`
    const url = new URL(pathValue, normalizedBaseUrl).toString()

    try {
      const response = await fetchImpl(url, {
        redirect: "follow",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      const headers = Array.from(response.headers.entries()).map(([key, value]) => ({ key, value }))
      const report = validateSecurityHeaders(headers)

      if (!report.passed) {
        passed = false
      }

      results.push({
        path: pathValue,
        url: response.url || url,
        status: response.status,
        passed: report.passed,
        report,
      })
    } catch (error) {
      passed = false
      results.push({
        path: pathValue,
        url,
        passed: false,
        error: formatRuntimeFetchError(error),
      })
    }
  }

  return { passed, results }
}
