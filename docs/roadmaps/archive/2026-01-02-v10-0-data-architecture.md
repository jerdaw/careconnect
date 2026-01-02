# Roadmap v10.0: Data Architecture & Governance

> **Status**: Implemented
> **Focus**: Strengthen data quality, enforce governance protocol, improve search ranking
> **Constraints**: Completely free, solo dev + AI assistance
> **Methodology**: Implemented based on comprehensive audit comparing ideal vs. current implementation

---

## Goal

Improve data quality and search relevance by:

1. **Schema Validation**: Catch data errors at build time with Zod validation
2. **Governance Enforcement**: Auto-downgrade stale services per governance protocol
3. **Search Ranking**: Boost verified and recently-updated services
4. **Verification Workflow**: Monthly/quarterly reminders for data freshness

---

## Design Decisions

### Storage Architecture: Keep JSON-First

| Decision                     | Rationale                                           |
| :--------------------------- | :-------------------------------------------------- |
| JSON as source of truth      | Git history = free audit trail; no migration needed |
| Supabase as optional overlay | Partner portal features without forced dependency   |
| Bundled JSON for PWA         | Offline-first without IndexedDB complexity          |
| In-memory singleton cache    | Simple, works, low maintenance burden               |

**Why not PostgreSQL-first?** For a solo dev + free project, JSON-first provides:

- Zero database costs
- Git blame = audit trail
- Direct editing without migrations
- Bundled into PWA for offline

### Search Architecture: Keep Lazy Semantic

| Decision                         | Rationale                                                 |
| :------------------------------- | :-------------------------------------------------------- |
| Client-side vector generation    | Privacy-preserving; no server-side embedding calls        |
| Keyword-first, semantic-optional | Works without WebGPU; semantic as progressive enhancement |
| Build-time embeddings            | all-MiniLM-L6-v2 (384d) - free, local, good quality       |

**Why not server-side semantic?** Privacy concerns + API costs. Current approach respects zero-knowledge architecture.

### Acquisition Architecture: Keep Manual Curation

| Decision                | Rationale                                  |
| :---------------------- | :----------------------------------------- |
| Manual JSON curation    | Embodies "accuracy > coverage" mandate     |
| AI-assisted research    | Antigravity verification method is working |
| 211 sync as placeholder | Activate when partnership materializes     |

**Why not automated scraping?** "Large-scale scraping produces noise, not value." (README)

---

## Implementation Details

### High Priority

---

### 1. Schema Validation

#### 1.1 Create Zod Schema

**File**: `lib/schemas/service.ts`

```typescript
import { z } from "zod"

// Verification levels matching types/service.ts
export const VerificationLevelSchema = z.enum(["L0", "L1", "L2", "L3"])

// Intent categories
export const IntentCategorySchema = z.enum([
  "Food",
  "Crisis",
  "Housing",
  "Health",
  "Legal",
  "Wellness",
  "Financial",
  "Employment",
  "Community",
  "Indigenous",
])

// Identity tag with evidence
export const IdentityTagSchema = z.object({
  tag: z.string().min(1, "Tag cannot be empty"),
  evidence_url: z.string().url("Evidence URL must be a valid URL"),
})

// Provenance information
export const ProvenanceSchema = z.object({
  verified_by: z.string().min(1),
  verified_at: z.string().datetime({ message: "Must be ISO 8601 datetime" }),
  evidence_url: z.string().url(),
  method: z.string().min(1),
})

// Structured operating hours
export const ServiceHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string() }).optional(),
  tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
  wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
  thursday: z.object({ open: z.string(), close: z.string() }).optional(),
  friday: z.object({ open: z.string(), close: z.string() }).optional(),
  saturday: z.object({ open: z.string(), close: z.string() }).optional(),
  sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  notes: z.string().optional(),
})

// Main Service schema
export const ServiceSchema = z
  .object({
    // Core Identity (Required)
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1, "Name is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    verification_level: VerificationLevelSchema,
    intent_category: IntentCategorySchema,
    provenance: ProvenanceSchema,
    identity_tags: z.array(IdentityTagSchema),
    synthetic_queries: z.array(z.string()),

    // Contact (at least one required - validated via refine)
    url: z.string().url().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),

    // Bilingual (validated via refine)
    name_fr: z.string().optional(),
    description_fr: z.string().optional(),
    address_fr: z.string().optional(),
    eligibility_notes: z.string().optional(),
    eligibility_notes_fr: z.string().optional(),
    synthetic_queries_fr: z.array(z.string()).optional(),
    access_script: z.string().optional(),
    access_script_fr: z.string().optional(),

    // Location
    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),

    // Scheduling
    hours: ServiceHoursSchema.optional(),

    // Additional fields
    fees: z.string().optional(),
    eligibility: z.string().optional(),
    application_process: z.string().optional(),
    languages: z.array(z.string()).optional(),
    bus_routes: z.array(z.string()).optional(),
    accessibility: z.record(z.boolean()).optional(),
    last_verified: z.string().optional(),
    cultural_safety: z.boolean().optional(),
    is_provincial: z.boolean().optional(),
    org_id: z.string().optional(),
    embedding: z.array(z.number()).optional(),
  })
  // Custom validation: at least one contact method
  .refine((data) => data.url || data.phone || data.address, {
    message: "At least one contact method required (url, phone, or address)",
    path: ["url"],
  })
  // Custom validation: Crisis services require phone
  .refine(
    (data) => {
      if (data.intent_category === "Crisis") {
        return !!data.phone
      }
      return true
    },
    {
      message: "Crisis services require a phone number",
      path: ["phone"],
    }
  )
  // Custom validation: Bilingual - either name_fr present or flag
  .refine(
    (data) => {
      // For now, we just warn if name_fr is missing
      // In strict mode, this would fail validation
      return true
    },
    {
      message: "French translation recommended for name",
      path: ["name_fr"],
    }
  )

export type ValidatedService = z.infer<typeof ServiceSchema>

// Array of services
export const ServicesArraySchema = z.array(ServiceSchema)
```

#### 1.2 Create Validation Script

**File**: `scripts/validate-services.ts`

```typescript
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
  console.log(" Validating services.json...")

  const rawData = readFileSync(DATA_PATH, "utf-8")
  const services = JSON.parse(rawData)

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
            serviceId: service.id || "UNKNOWN",
            serviceName: service.name || "UNKNOWN",
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
  console.log("\n Validation Results:")
  console.log(`  Total services: ${result.summary.total}`)
  console.log(`  ✅ Passed: ${result.summary.passed}`)
  console.log(`  ❌ Failed: ${result.summary.failed}`)
  console.log(`  ⚠️ Warnings: ${result.summary.warnings}`)

  if (result.errors.length > 0) {
    console.log("\n Errors and Warnings:\n")

    // Group by service
    const grouped = result.errors.reduce(
      (acc, err) => {
        const key = `${err.serviceId} (${err.serviceName})`
        if (!acc[key]) acc[key] = []
        acc[key].push(err)
        return acc
      },
      {} as Record<string, typeof result.errors>
    )

    for (const [service, errors] of Object.entries(grouped)) {
      console.log(` ${service}:`)
      for (const err of errors) {
        const icon = err.severity === "error" ? "❌" : "⚠️"
        console.log(`  ${icon} ${err.path}: ${err.message}`)
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
```

#### 1.3 Add to CI Pipeline

**Update**: `.github/workflows/ci.yml`

Add after the lint step:

```yaml
- name: Validate Service Data
 run: npx tsx scripts/validate-services.ts
```

Full context (insert after lint, before build):

```yaml
jobs:
 ci:
  runs-on: ubuntu-latest
  steps:
   # ... existing steps ...

   - name: Lint
    run: npm run lint

   - name: Validate Service Data
    run: npx tsx scripts/validate-services.ts

   - name: Type Check
    run: npm run type-check

   # ... remaining steps ...
```

#### 1.4 Update package.json

Add npm script:

```json
{
  "scripts": {
    "validate-data": "tsx scripts/validate-services.ts"
  }
}
```

---

### 2. Staleness Enforcement

#### 2.1 Create Staleness Check Script

**File**: `scripts/check-staleness.ts`

```typescript
#!/usr/bin/env npx tsx
import { readFileSync } from "fs"
import path from "path"
import type { Service } from "../types/service"

const DATA_PATH = path.join(process.cwd(), "data/services.json")

// Staleness thresholds (in days)
const THRESHOLDS = {
  CRISIS: 30, // Crisis services: monthly verification
  GENERAL: 90, // General services: quarterly verification
  STALE: 180, // Auto-downgrade threshold: 6 months
}

interface StalenessResult {
  service: Service
  lastVerified: Date | null
  daysSinceVerification: number | null
  status: "fresh" | "due" | "stale" | "unknown"
  recommendation: string
}

function getVerificationDate(service: Service): Date | null {
  // Try provenance.verified_at first, then last_verified
  const dateStr = service.provenance?.verified_at || service.last_verified
  if (!dateStr) return null

  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

function getDaysSince(date: Date | null): number | null {
  if (!date) return null
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function checkStaleness(): StalenessResult[] {
  console.log(" Checking service staleness...")
  console.log(
    `  Thresholds: Crisis=${THRESHOLDS.CRISIS}d, General=${THRESHOLDS.GENERAL}d, Stale=${THRESHOLDS.STALE}d\n`
  )

  const rawData = readFileSync(DATA_PATH, "utf-8")
  const services: Service[] = JSON.parse(rawData)

  const results: StalenessResult[] = []

  for (const service of services) {
    const lastVerified = getVerificationDate(service)
    const daysSince = getDaysSince(lastVerified)
    const isCrisis = service.intent_category === "Crisis"
    const threshold = isCrisis ? THRESHOLDS.CRISIS : THRESHOLDS.GENERAL

    let status: StalenessResult["status"]
    let recommendation: string

    if (daysSince === null) {
      status = "unknown"
      recommendation = "Add verification date to provenance.verified_at"
    } else if (daysSince >= THRESHOLDS.STALE) {
      status = "stale"
      recommendation = `URGENT: Downgrade to L0 or verify immediately (${daysSince} days old)`
    } else if (daysSince >= threshold) {
      status = "due"
      recommendation = `Verification due (${daysSince} days since last verification)`
    } else {
      status = "fresh"
      recommendation = `OK (${daysSince} days since verification)`
    }

    results.push({
      service,
      lastVerified,
      daysSinceVerification: daysSince,
      status,
      recommendation,
    })
  }

  return results
}

function printResults(results: StalenessResult[]) {
  const stale = results.filter((r) => r.status === "stale")
  const due = results.filter((r) => r.status === "due")
  const unknown = results.filter((r) => r.status === "unknown")
  const fresh = results.filter((r) => r.status === "fresh")

  console.log(" Staleness Report:")
  console.log(`  Total services: ${results.length}`)
  console.log(`  ✅ Fresh: ${fresh.length}`)
  console.log(`  Due for verification: ${due.length}`)
  console.log(`  STALE (>6 months): ${stale.length}`)
  console.log(`  Unknown (no date): ${unknown.length}`)

  if (stale.length > 0) {
    console.log("\n STALE SERVICES (require immediate attention):\n")
    for (const r of stale) {
      console.log(`  ${r.service.id}`)
      console.log(`   Name: ${r.service.name}`)
      console.log(`   Category: ${r.service.intent_category}`)
      console.log(`   Last verified: ${r.lastVerified?.toISOString().split("T")[0] || "never"}`)
      console.log(`   Days since: ${r.daysSinceVerification}`)
      console.log(`   Action: ${r.recommendation}`)
      console.log()
    }
  }

  if (due.length > 0) {
    console.log("\n SERVICES DUE FOR VERIFICATION:\n")
    for (const r of due) {
      console.log(`  - ${r.service.id} (${r.service.intent_category}): ${r.daysSinceVerification} days`)
    }
  }

  if (unknown.length > 0) {
    console.log("\n SERVICES WITH NO VERIFICATION DATE:\n")
    for (const r of unknown) {
      console.log(`  - ${r.service.id}`)
    }
  }

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const fs = require("fs")
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `stale_count=${stale.length}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `due_count=${due.length}\n`)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `stale_ids=${stale.map((r) => r.service.id).join(",")}\n`)
  }
}

// Main execution
const results = checkStaleness()
printResults(results)

// Exit with warning if stale services found
const staleCount = results.filter((r) => r.status === "stale").length
if (staleCount > 0) {
  console.log(`\n⚠️ ${staleCount} stale service(s) found. Consider downgrading to L0.`)
}
```

#### 2.2 Create GitHub Action for Monthly Check

**File**: `.github/workflows/staleness-check.yml`

```yaml
name: Monthly Staleness Check

on:
 schedule:
  # Run at 9am ET on the 1st of each month
  - cron: "0 14 1 * *"
 workflow_dispatch: # Allow manual trigger

jobs:
 check-staleness:
  runs-on: ubuntu-latest
  permissions:
   issues: write
   contents: read

  steps:
   - name: Checkout
    uses: actions/checkout@v4

   - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
     node-version: "20"
     cache: "npm"

   - name: Install dependencies
    run: npm ci

   - name: Run staleness check
    id: staleness
    run: npx tsx scripts/check-staleness.ts

   - name: Create issue if stale services found
    if: steps.staleness.outputs.stale_count > 0
    uses: actions/github-script@v7
    with:
     script: |
      const staleIds = '${{ steps.staleness.outputs.stale_ids }}'.split(',');
      const staleCount = parseInt('${{ steps.staleness.outputs.stale_count }}');

      const body = `## Stale Services Detected

      **${staleCount} service(s)** have not been verified in over 6 months.

      Per the [Governance Protocol](docs/governance.md), services not verified in >6 months should be downgraded to L0 (hidden).

      ### Services Requiring Attention

      ${staleIds.map(id => `- [ ] \`${id}\``).join('\n')}

      ### Actions Required

      For each service above:
      1. Verify the service is still operating (call phone, check website)
      2. Update \`provenance.verified_at\` in \`data/services.json\`
      3. OR downgrade \`verification_level\` to "L0" if no longer valid

      ### Verification Checklist

      - [ ] Phone number connects
      - [ ] Website loads
      - [ ] Hours are current
      - [ ] Address is correct
      - [ ] French translation is current

      ---
      *This issue was automatically created by the staleness check workflow.*
      `;

      await github.rest.issues.create({
       owner: context.repo.owner,
       repo: context.repo.repo,
       title: ` Monthly Staleness Check: ${staleCount} stale service(s) found`,
       body: body,
       labels: ['data-quality', 'governance']
      });
```

#### 2.3 Update package.json

```json
{
  "scripts": {
    "check-staleness": "tsx scripts/check-staleness.ts"
  }
}
```

---

### 3. Search Ranking Improvements

#### 3.1 Update Scoring Weights

**File**: `lib/search/scoring.ts`

Add to `WEIGHTS` constant:

```typescript
export const WEIGHTS: ScoringWeights = {
  vector: 100, // Semantic match is the gold standard
  syntheticQuery: 50,
  name: 30,
  identityTag: 20,
  description: 10,
  // NEW: Verification and freshness multipliers
  verificationL3: 1.2, // L3 = +20% boost
  verificationL2: 1.1, // L2 = +10% boost
  verificationL1: 1.0, // L1 = baseline
  freshnessRecent: 1.1, // Verified <30 days = +10%
  freshnessNormal: 1.0, // Verified 30-90 days = baseline
  freshnessStale: 0.9, // Verified >90 days = -10%
}
```

#### 3.2 Add Helper Functions

**Add to**: `lib/search/scoring.ts`

```typescript
import { VerificationLevel } from "@/types/service"

/**
 * Returns a score multiplier based on verification level.
 * Higher verification = higher trust = better ranking.
 */
export function getVerificationMultiplier(level: VerificationLevel): number {
  switch (level) {
    case VerificationLevel.L3:
      return WEIGHTS.verificationL3 // 1.2
    case VerificationLevel.L2:
      return WEIGHTS.verificationL2 // 1.1
    case VerificationLevel.L1:
    case VerificationLevel.L0:
    default:
      return WEIGHTS.verificationL1 // 1.0
  }
}

/**
 * Returns a score multiplier based on how recently the service was verified.
 * Recent verification = more reliable data = better ranking.
 */
export function getFreshnessMultiplier(verifiedAt: string | undefined): number {
  if (!verifiedAt) return WEIGHTS.freshnessStale // No date = assume stale

  const verifiedDate = new Date(verifiedAt)
  if (isNaN(verifiedDate.getTime())) return WEIGHTS.freshnessStale

  const now = new Date()
  const daysSince = Math.floor((now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSince <= 30) return WEIGHTS.freshnessRecent // 1.1
  if (daysSince <= 90) return WEIGHTS.freshnessNormal // 1.0
  return WEIGHTS.freshnessStale // 0.9
}
```

#### 3.3 Apply Multipliers in Scoring Function

**Update `scoreServiceKeyword` in**: `lib/search/scoring.ts`

At the end of the function, before `return { score, reasons }`:

```typescript
// 6. Verification Level Boost
const verificationMultiplier = getVerificationMultiplier(service.verification_level)
if (verificationMultiplier !== 1.0) {
  score *= verificationMultiplier
  const boostPercent = Math.round((verificationMultiplier - 1) * 100)
  if (boostPercent > 0) {
    matchReasons.push(`Verification Boost (+${boostPercent}%)`)
  }
}

// 7. Freshness Boost
const verifiedAt = service.provenance?.verified_at || service.last_verified
const freshnessMultiplier = getFreshnessMultiplier(verifiedAt)
if (freshnessMultiplier !== 1.0) {
  score *= freshnessMultiplier
  const boostPercent = Math.round((freshnessMultiplier - 1) * 100)
  if (boostPercent > 0) {
    matchReasons.push(`Fresh Data Boost (+${boostPercent}%)`)
  } else if (boostPercent < 0) {
    matchReasons.push(`Stale Data Penalty (${boostPercent}%)`)
  }
}

return { score, reasons: matchReasons }
```

#### 3.4 Add Unit Tests

**File**: `tests/unit/search/scoring.test.ts`

Add test cases:

```typescript
import { describe, it, expect } from "vitest"
import { getVerificationMultiplier, getFreshnessMultiplier, scoreServiceKeyword, WEIGHTS } from "@/lib/search/scoring"
import { VerificationLevel } from "@/types/service"

describe("getVerificationMultiplier", () => {
  it("returns 1.2 for L3 verification", () => {
    expect(getVerificationMultiplier(VerificationLevel.L3)).toBe(1.2)
  })

  it("returns 1.1 for L2 verification", () => {
    expect(getVerificationMultiplier(VerificationLevel.L2)).toBe(1.1)
  })

  it("returns 1.0 for L1 verification", () => {
    expect(getVerificationMultiplier(VerificationLevel.L1)).toBe(1.0)
  })
})

describe("getFreshnessMultiplier", () => {
  it("returns 1.1 for services verified within 30 days", () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 15)
    expect(getFreshnessMultiplier(recentDate.toISOString())).toBe(1.1)
  })

  it("returns 1.0 for services verified 30-90 days ago", () => {
    const normalDate = new Date()
    normalDate.setDate(normalDate.getDate() - 60)
    expect(getFreshnessMultiplier(normalDate.toISOString())).toBe(1.0)
  })

  it("returns 0.9 for services verified over 90 days ago", () => {
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - 120)
    expect(getFreshnessMultiplier(staleDate.toISOString())).toBe(0.9)
  })

  it("returns 0.9 for undefined verification date", () => {
    expect(getFreshnessMultiplier(undefined)).toBe(0.9)
  })
})

describe("scoreServiceKeyword with boosts", () => {
  const baseService = {
    id: "test-service",
    name: "Test Food Bank",
    name_fr: "Banque alimentaire test",
    description: "Provides food assistance",
    description_fr: "Fournit une aide alimentaire",
    url: "https://example.com",
    verification_level: VerificationLevel.L1,
    intent_category: "Food",
    provenance: {
      verified_by: "test",
      verified_at: new Date().toISOString(),
      evidence_url: "https://example.com",
      method: "test",
    },
    identity_tags: [],
    synthetic_queries: ["free food", "food bank"],
  }

  it("applies verification boost for L3 services", () => {
    const l1Service = { ...baseService, verification_level: VerificationLevel.L1 }
    const l3Service = { ...baseService, verification_level: VerificationLevel.L3 }

    const l1Result = scoreServiceKeyword(l1Service, ["food"])
    const l3Result = scoreServiceKeyword(l3Service, ["food"])

    expect(l3Result.score).toBeGreaterThan(l1Result.score)
    expect(l3Result.reasons).toContain("Verification Boost (+20%)")
  })

  it("applies freshness boost for recently verified services", () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 7)

    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - 120)

    const freshService = {
      ...baseService,
      provenance: { ...baseService.provenance, verified_at: recentDate.toISOString() },
    }
    const staleService = {
      ...baseService,
      provenance: { ...baseService.provenance, verified_at: staleDate.toISOString() },
    }

    const freshResult = scoreServiceKeyword(freshService, ["food"])
    const staleResult = scoreServiceKeyword(staleService, ["food"])

    expect(freshResult.score).toBeGreaterThan(staleResult.score)
    expect(freshResult.reasons).toContain("Fresh Data Boost (+10%)")
  })
})
```

---

### Medium Priority

---

### 4. Verification Reminders

#### 4.1 Monthly Crisis Service Reminder

**File**: `.github/workflows/crisis-verification-reminder.yml`

```yaml
name: Monthly Crisis Service Verification

on:
 schedule:
  # Run at 9am ET on the 1st of each month
  - cron: "0 14 1 * *"
 workflow_dispatch:

jobs:
 create-reminder:
  runs-on: ubuntu-latest
  permissions:
   issues: write

  steps:
   - name: Create verification reminder issue
    uses: actions/github-script@v7
    with:
     script: |
      const today = new Date();
      const month = today.toLocaleString('default', { month: 'long', year: 'numeric' });

      await github.rest.issues.create({
       owner: context.repo.owner,
       repo: context.repo.repo,
       title: ` Monthly Crisis Service Verification - ${month}`,
       body: `## Crisis Service Verification Checklist

      Per the [Governance Protocol](docs/governance.md), crisis services must be verified **monthly**.

      ### Services to Verify

      - [ ] Kids Help Phone (1-800-668-6868)
      - [ ] Trans Lifeline (1-877-330-6366)
      - [ ] Hope for Wellness Helpline (1-855-242-3310)
      - [ ] Assaulted Women's Helpline (1-866-863-0511)
      - [ ] Kingston Interval House (613-546-1777)
      - [ ] Telephone Aid Line Kingston (613-544-1771)
      - [ ] Other crisis services in \`data/services.json\` with \`intent_category: "Crisis"\`

      ### Verification Steps

      For each service:
      1. [ ] Call the phone number - does it connect?
      2. [ ] Check the website - does it load?
      3. [ ] Verify hours match what's in our data
      4. [ ] Update \`provenance.verified_at\` to today's date

      ### After Verification

      - Commit changes to \`data/services.json\`
      - Run \`npm run generate-embeddings\` if descriptions changed
      - Close this issue

      ---
      *Automatically created by verification reminder workflow.*
      `,
       labels: ['verification', 'crisis-services', 'monthly']
      });
```

#### 4.2 Quarterly General Verification

**File**: `.github/workflows/quarterly-verification-reminder.yml`

```yaml
name: Quarterly General Service Verification

on:
 schedule:
  # Run at 9am ET on Jan 1, Apr 1, Jul 1, Oct 1
  - cron: "0 14 1 1,4,7,10 *"
 workflow_dispatch:

jobs:
 create-reminder:
  runs-on: ubuntu-latest
  permissions:
   issues: write

  steps:
   - name: Create verification reminder issue
    uses: actions/github-script@v7
    with:
     script: |
      const today = new Date();
      const quarter = Math.floor(today.getMonth() / 3) + 1;
      const year = today.getFullYear();

      await github.rest.issues.create({
       owner: context.repo.owner,
       repo: context.repo.repo,
       title: ` Q${quarter} ${year} General Service Verification`,
       body: `## Quarterly Service Verification

      Per the [Governance Protocol](docs/governance.md), general services must be verified **quarterly**.

      ### Categories to Review

      - [ ] Food (food banks, meal programs)
      - [ ] Housing (shelters, housing help)
      - [ ] Health (clinics, dental, mental health)
      - [ ] Legal (legal clinics)
      - [ ] Community (newcomer services, youth hubs)
      - [ ] Indigenous (culturally-specific services)

      ### Verification Checklist

      For each service:
      - [ ] Phone number connects
      - [ ] Website loads and is current
      - [ ] Address is correct
      - [ ] Hours match current operations
      - [ ] Eligibility criteria still accurate
      - [ ] French translation is current

      ### Process

      1. Run \`npm run check-staleness\` to see which services are due
      2. Verify each flagged service
      3. Update \`provenance.verified_at\` in \`data/services.json\`
      4. Commit changes
      5. Close this issue

      ---
      *Automatically created by quarterly verification workflow.*
      `,
       labels: ['verification', 'quarterly']
      });
```

#### 4.3 Issue Template for Verification

**File**: `.github/ISSUE_TEMPLATE/service-verification.md`

````yaml
---
name: Service Verification
about: Verify a specific service's information is current
title: " Verify: [SERVICE NAME]"
labels: verification
assignees: ""
---

## Service Details

**Service ID**:
**Service Name**:
**Category**:
**Last Verified**:

---

## Verification Checklist

### Contact Information
- [ ] Phone number connects and reaches the service
- [ ] Website loads correctly
- [ ] Email is valid (if listed)
- [ ] Address is correct (if physical location)

### Service Information
- [ ] Hours of operation are current
- [ ] Eligibility criteria are accurate
- [ ] Fees information is current
- [ ] Description accurately reflects current services

### Bilingual Content
- [ ] French name (`name_fr`) is accurate
- [ ] French description (`description_fr`) is accurate
- [ ] French eligibility notes are current

### Identity Tags
- [ ] All identity tags have valid `evidence_url`
- [ ] Evidence URLs are still accessible

---

## After Verification

1. Update `data/services.json`:
  - Set `provenance.verified_at` to today (ISO format)
  - Set `provenance.verified_by` to your name/handle
  - Update any changed information

2. If descriptions changed significantly:
  ```bash
  npm run generate-embeddings
````

3. Commit and push changes

4. Close this issue

````

---

### 5. Synonym Expansion

#### 5.1 Current Coverage Audit

**Current state of `lib/search/synonyms.ts`**:

| Root Word | Synonyms | Languages |
|:----------|:---------|:----------|
| food | hungry, meal, groceries, starving, eat, pantry, hamper | EN + FR (nourriture, manger) |
| hungry | food, meal, groceries, starving | EN + FR (faim) |
| groceries | food, pantry, supermarket, market | EN + FR (épicerie) |
| meal | dinner, lunch, breakfast, supper | EN + FR (repas) |
| housing | shelter, homeless, apartment, rent, eviction | EN + FR (logement, abri, itinerance) |
| shelter | bed, sleep, homeless, emergency | EN + FR (refuge) |
| homeless | shelter, street, encampment, couch surfing | EN + FR (sans-abri) |
| rent | housing, landlord, tenant, lease, eviction | EN + FR (loyer) |
| health | doctor, nurse, hospital, clinic, medical | EN + FR (santé, médecin) |
| doctor | physician, md, gp, practitioner | EN + FR (docteur) |
| dental | teeth, tooth, dentist, cavity, pain | EN + FR (dentaire) |
| therapy | counseling, psychologist, psychiatrist, mental health, talk | EN + FR (thérapie) |
| crisis | emergency, danger, urgent, suicide, help, 911 | EN + FR (crise, urgence) |

#### 5.2 Recommended Additions

```typescript
// Add to lib/search/synonyms.ts

export const SYNONYMS: Record<string, string[]> = {
 // ... existing entries ...

 // Mental Health (expanded)
 anxiety: ["anxious", "panic", "worried", "nervous", "stress", "anxiété"],
 depression: ["depressed", "sad", "hopeless", "suicidal", "dépression", "triste"],
 counseling: ["therapy", "therapist", "counsellor", "psychologist", "conseil"],
 addiction: ["substance", "drugs", "alcohol", "recovery", "rehab", "dépendance"],

 // Youth Services (expanded)
 teen: ["teenager", "adolescent", "youth", "young", "ado", "jeune"],
 child: ["children", "kid", "kids", "minor", "enfant", "enfants"],
 student: ["school", "university", "college", "études", "étudiant"],

 // Financial (expanded)
 welfare: ["ow", "ontario works", "social assistance", "aide sociale"],
 disability: ["odsp", "disabled", "accessibility", "handicap", "invalidité"],
 income: ["money", "cash", "financial", "low income", "revenu", "argent"],

 // Identity (enhanced French)
 indigenous: ["aboriginal", "first nations", "metis", "inuit", "native", "autochtone", "premières nations"],
 lgbt: ["gay", "queer", "trans", "transgender", "2slgbtqi+", "pride", "lgbtq", "fierté"],
 newcomer: ["immigrant", "refugee", "new to canada", "immigrant", "réfugié", "nouvel arrivant"],
 senior: ["elderly", "old", "aged", "retirement", "65+", "aîné", "personne âgée"],
 veteran: ["military", "forces", "army", "vétéran", "militaire"],

 // Common misspellings / abbreviations
 er: ["emergency", "hospital", "urgence"],
 doc: ["doctor", "physician", "médecin"],
 apt: ["apartment", "housing", "appartement"],
}
````

#### 5.3 Process Documentation

Add to `CONTRIBUTING.md`:

````markdown
## Adding Search Synonyms

The search system uses synonym expansion to improve query matching. To add new synonyms:

### 1. Edit the Synonyms Dictionary

Location: `lib/search/synonyms.ts`

```typescript
export const SYNONYMS: Record<string, string[]> = {
  // Add your new root word with its synonyms
  newterm: ["synonym1", "synonym2", "french_équivalent"],
}
```
````

### 2. Guidelines

- **Include French terms** for all entries where applicable
- **Add common misspellings** (e.g., "fod" for "food")
- **Include abbreviations** (e.g., "er" for "emergency")
- **Test before committing**: `npx tsx scripts/search-cli.ts "your query"`

### 3. When to Add Synonyms

- When analytics show zero-result queries
- When user feedback indicates search gaps
- When adding new service categories

````

---

## Explicitly Not Implementing

| Proposal | Reason |
|:------- |:----- |
| Migrate to PostgreSQL-first | JSON-first better for solo dev + offline PWA |
| Server-side semantic search | Privacy concerns + API costs |
| Phone/URL normalization | Low value for ~50 services |
| Formal audit tables in DB | Git history provides this free |
| Soft deletes | Git history provides recovery |
| IndexedDB for PWA | Bundled JSON achieves offline goal; revisit if >500 services |

---

## Verification Plan

### Automated Tests

```bash
# Run all checks
npm test               # Unit tests (including new scoring tests)
npx tsx scripts/validate-services.ts # Schema validation
npx tsx scripts/check-staleness.ts  # Staleness report
npm run type-check          # TypeScript
npm run lint             # ESLint
````

### Manual Verification

1. **Search with Debug**: Search "food" and verify:

- Results include match reasons
- L3 services show "Verification Boost (+20%)"
- Recently verified services show "Fresh Data Boost (+10%)"

2. **Crisis Detection**: Search "I want to kill myself"

- Crisis services appear at top
- +1000 crisis boost visible in debug

3. **Staleness Report**: Run `npm run check-staleness`

- Report shows categorized results
- Stale services (if any) are flagged

4. **GitHub Actions**: Navigate to Actions tab

- Scheduled workflows visible
- Manual trigger works

---

## Files Changed Summary

| File                                                    | Action | Purpose                           |
| :------------------------------------------------------ | :----- | :-------------------------------- |
| `lib/schemas/service.ts`                                | NEW    | Zod schema for validation         |
| `scripts/validate-services.ts`                          | NEW    | Validation script                 |
| `scripts/check-staleness.ts`                            | NEW    | Staleness audit script            |
| `lib/search/scoring.ts`                                 | MODIFY | Add verification/freshness boosts |
| `tests/unit/search/scoring.test.ts`                     | MODIFY | Add boost tests                   |
| `.github/workflows/ci.yml`                              | MODIFY | Add validation step               |
| `.github/workflows/staleness-check.yml`                 | NEW    | Monthly staleness check           |
| `.github/workflows/crisis-verification-reminder.yml`    | NEW    | Monthly crisis reminder           |
| `.github/workflows/quarterly-verification-reminder.yml` | NEW    | Quarterly reminder                |
| `.github/ISSUE_TEMPLATE/service-verification.md`        | NEW    | Verification template             |
| `lib/search/synonyms.ts`                                | MODIFY | Expand synonym dictionary         |
| `CONTRIBUTING.md`                                       | MODIFY | Document synonym process          |
| `package.json`                                          | MODIFY | Add npm scripts                   |

---

## Reference Documents

- [Current State Audit](file:///home/jer/.gemini/antigravity/brain/6dd3ff61-0d38-45b9-a22d-2952dcd3c3bb/current_state_audit.md) - How things currently work
- [Best Path Forward](file:///home/jer/.gemini/antigravity/brain/6dd3ff61-0d38-45b9-a22d-2952dcd3c3bb/implementation_plan.md) - Decision rationale
- [Governance Protocol](file:///home/jer/LocalSync/kingston-care-connect/docs/governance.md) - L-Scale definitions
- [Architecture Overview](file:///home/jer/LocalSync/kingston-care-connect/docs/architecture.md) - System design

---

> **Created**: 2026-01-02
> **Author**: Antigravity + Jeremy
> **Version**: 1.0 (Full Implementation Details)
