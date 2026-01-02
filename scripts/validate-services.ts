#!/usr/bin/env npx tsx
import { readFileSync } from "fs"
import path from "path"
import { ServicesArraySchema } from "../lib/schemas/service"
import { ZodError } from "zod"

const DATA_PATH = path.join(process.cwd(), "data/services.json")

interface ValidationResult {
  valid: boolean
  errors: Array<{
    serviceId: string
    serviceName: string
    path: string
    message: string
    severity: "error" | "warning"
  }>
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

function validateServices(): ValidationResult {
  console.log("🔍 Validating services.json...")

  const rawData = readFileSync(DATA_PATH, "utf-8")
   
  const services = JSON.parse(rawData) as unknown[]

  const result: ValidationResult = {
    valid: true,
    errors: [],
    summary: {
      total: services.length,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  }

  // Validate each service individually for better error reporting
  for (const service of services) {
    try {
      ServicesArraySchema.element.parse(service)
      result.summary.passed++
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          const isWarning = issue.message.includes("recommended")
          
          result.errors.push({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            serviceId: (service as any).id || "UNKNOWN",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            serviceName: (service as any).name || "UNKNOWN",
            path: issue.path.join("."),
            message: issue.message,
            severity: isWarning ? "warning" : "error",
          })

          if (isWarning) {
            result.summary.warnings++
          } else {
            result.valid = false
            result.summary.failed++
          }
        }
      }
    }
  }

  return result
}

function printResults(result: ValidationResult) {
  console.log("\n📊 Validation Results:")
  console.log(`   Total services: ${result.summary.total}`)
  console.log(`   ✅ Passed: ${result.summary.passed}`)
  console.log(`   ❌ Failed: ${result.summary.failed}`)
  console.log(`   ⚠️  Warnings: ${result.summary.warnings}`)

  if (result.errors.length > 0) {
    console.log("\n🔴 Errors and Warnings:\n")
    
    // Group by service
    const grouped = result.errors.reduce((acc, err) => {
      const key = `${err.serviceId} (${err.serviceName})`
      if (!acc[key]) acc[key] = []
      acc[key].push(err)
      return acc
    }, {} as Record<string, typeof result.errors>)

    for (const [service, errors] of Object.entries(grouped)) {
      console.log(`  ${service}:`)
      for (const err of errors) {
        const icon = err.severity === "error" ? "❌" : "⚠️"
        console.log(`    ${icon} ${err.path}: ${err.message}`)
      }
      console.log()
    }
  }

  if (result.valid) {
    console.log("\n✅ All services pass validation!")
  } else {
    console.log("\n❌ Validation failed. Fix errors above.")
  }
}

// Main execution
const result = validateServices()
printResults(result)

// Exit with appropriate code
process.exit(result.valid ? 0 : 1)
