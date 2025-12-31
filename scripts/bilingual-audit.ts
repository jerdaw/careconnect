#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from "fs"
import path from "path"

interface Service {
    id: string
    name: string
    name_fr?: string
    description: string
    description_fr?: string
    eligibility_notes?: string
    eligibility_notes_fr?: string
}

interface AuditResult {
    serviceId: string
    serviceName: string
    missingFields: string[]
}

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")
const REPORT_PATH = path.join(process.cwd(), "data/bilingual-audit-report.json")

function auditServices(): AuditResult[] {
    const services = JSON.parse(readFileSync(SERVICES_PATH, "utf-8")) as Service[]
    const issues: AuditResult[] = []

    for (const service of services) {
        const missingFields: string[] = []

        if (!service.name_fr?.trim()) missingFields.push("name_fr")
        if (!service.description_fr?.trim()) missingFields.push("description_fr")
        if (service.eligibility_notes && !service.eligibility_notes_fr?.trim()) {
            missingFields.push("eligibility_notes_fr")
        }

        if (missingFields.length > 0) {
            issues.push({
                serviceId: service.id,
                serviceName: service.name,
                missingFields,
            })
        }
    }

    return issues
}

function main() {
    console.log("🔍 Running bilingual content audit...")

    const issues = auditServices()

    if (issues.length === 0) {
        console.log("✅ All services have complete French translations!")
        process.exit(0)
    }

    console.log(`\n⚠️  Found ${issues.length} services with missing French content:\n`)

    const fieldCounts: Record<string, number> = {}
    for (const issue of issues) {
        for (const field of issue.missingFields) {
            fieldCounts[field] = (fieldCounts[field] || 0) + 1
        }
    }

    console.log("Missing Fields Summary:")
    for (const [field, count] of Object.entries(fieldCounts)) {
        console.log(`  - ${field}: ${count} services`)
    }

    writeFileSync(REPORT_PATH, JSON.stringify({ generated: new Date().toISOString(), issues }, null, 2))
    console.log(`\n📝 Detailed report saved to: ${REPORT_PATH}`)

    process.exit(1)
}

main()
