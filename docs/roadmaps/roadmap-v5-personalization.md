# Roadmap V5: Personalization & Data Pipelines

> **Status**: Planning  
> **Owner**: TBD  
> **Start Date**: TBD  
> **Last Updated**: 2025-12-31

---

## Executive Summary

Roadmap V5 builds on the completed **Privacy-First Intelligent Assistant** (Phase 4) and focuses on:

1.  **Personalized User Experience**: Allowing users to optionally store preferences locally for tailored results.
2.  **Automated Data Pipelines**: Reducing manual effort in keeping services up-to-date.
3.  **Community & Partner Features**: Enabling organizations to self-manage their listings.
4.  **Advanced AI**: Enhancing the conversational assistant with memory and voice.

All features continue to adhere to **strict privacy principles** (no user data egress unless explicitly opted-in by partner organizations).

---

## Phase 5: Personalization (Est. 1-2 Weeks)

### 5.1 Smart Eligibility Checker

**Goal**: Show users visual indicators ("✅ You likely qualify") on service cards based on a local, opt-in profile.

#### TypeScript Interfaces

```typescript
// types/user-context.ts
export type AgeGroup = "youth" | "adult" | "senior"
export type IdentityTag = "indigenous" | "newcomer" | "2slgbtqi+" | "veteran" | "disability"

export interface UserContext {
  ageGroup: AgeGroup | null
  identities: IdentityTag[]
  hasOptedIn: boolean
}

// types/eligibility.ts
export interface EligibilityCriteria {
  minAge?: number
  maxAge?: number
  requiredIdentities?: IdentityTag[]
  excludedIdentities?: IdentityTag[]
}

export type EligibilityStatus = "eligible" | "ineligible" | "unknown"
```

---

#### [NEW] `hooks/useUserContext.ts`

```typescript
"use client"
import { useLocalStorage } from "./useLocalStorage"
import type { UserContext, AgeGroup, IdentityTag } from "@/types/user-context"

const DEFAULT_CONTEXT: UserContext = {
  ageGroup: null,
  identities: [],
  hasOptedIn: false,
}

export function useUserContext() {
  const [context, setContext, clearContext] = useLocalStorage<UserContext>("kcc_user_context", DEFAULT_CONTEXT)

  const updateAgeGroup = (ageGroup: AgeGroup | null) => {
    setContext((prev) => ({ ...prev, ageGroup }))
  }

  const toggleIdentity = (tag: IdentityTag) => {
    setContext((prev) => ({
      ...prev,
      identities: prev.identities.includes(tag) ? prev.identities.filter((t) => t !== tag) : [...prev.identities, tag],
    }))
  }

  const optIn = () => setContext((prev) => ({ ...prev, hasOptedIn: true }))
  const optOut = () => clearContext()

  return { context, updateAgeGroup, toggleIdentity, optIn, optOut }
}
```

---

#### [NEW] `lib/eligibility/checker.ts`

```typescript
import type { UserContext, EligibilityCriteria, EligibilityStatus } from "@/types"
import type { Service } from "@/types/service"

const AGE_MAP: Record<string, { min: number; max: number }> = {
  youth: { min: 0, max: 29 },
  adult: { min: 18, max: 64 },
  senior: { min: 55, max: 120 },
}

export function parseEligibility(notes: string): EligibilityCriteria {
  const criteria: EligibilityCriteria = {}
  // Pattern: "Ages 18-29" or "Must be Indigenous"
  const ageMatch = notes.match(/Ages?\s*(\d+)(?:\s*[-–]\s*(\d+))?/i)
  if (ageMatch) {
    criteria.minAge = parseInt(ageMatch[1], 10)
    criteria.maxAge = ageMatch[2] ? parseInt(ageMatch[2], 10) : undefined
  }
  // Identity keywords
  if (/indigenous/i.test(notes)) criteria.requiredIdentities = ["indigenous"]
  if (/newcomer|immigrant/i.test(notes)) criteria.requiredIdentities = ["newcomer"]
  if (/2slgbtqi\+|lgbtq/i.test(notes)) criteria.requiredIdentities = ["2slgbtqi+"]
  return criteria
}

export function checkEligibility(service: Service, context: UserContext): EligibilityStatus {
  if (!context.hasOptedIn || !service.eligibility_notes) return "unknown"

  const criteria = parseEligibility(service.eligibility_notes)
  const userAge = context.ageGroup ? AGE_MAP[context.ageGroup] : null

  // Age check
  if (criteria.minAge && userAge && userAge.max < criteria.minAge) return "ineligible"
  if (criteria.maxAge && userAge && userAge.min > criteria.maxAge) return "ineligible"

  // Identity check
  if (criteria.requiredIdentities?.length) {
    const hasRequired = criteria.requiredIdentities.some((tag) => context.identities.includes(tag))
    if (!hasRequired) return "ineligible"
  }

  return "eligible"
}
```

---

#### [MODIFY] `components/ServiceCard.tsx`

Add eligibility badge conditionally:

```tsx
import { useUserContext } from "@/hooks/useUserContext"
import { checkEligibility } from "@/lib/eligibility/checker"

// Inside ServiceCard component:
const { context } = useUserContext()
const eligibility = checkEligibility(service, context)

// In JSX, after the title:
{
  eligibility === "eligible" && (
    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
      ✓ You may qualify
    </span>
  )
}
```

---

### 5.2 Identity-Aware Ranking

**Goal**: Boost services that match user identities.

#### [MODIFY] `lib/search/scoring.ts`

```typescript
import type { UserContext } from "@/types/user-context"

export interface ScoringOptions {
  userContext?: UserContext
  // ... existing options
}

export function calculateScore(service: Service, query: string, options: ScoringOptions = {}): number {
  let score = baseScore(service, query)

  // Identity boost (up to 20% bonus)
  if (options.userContext?.identities.length) {
    const matchingTags = service.identity_tags?.filter((tag) =>
      options.userContext!.identities.includes(tag.tag.toLowerCase() as any)
    )
    if (matchingTags?.length) {
      score *= 1 + 0.1 * matchingTags.length // 10% per matching tag
    }
  }

  return score
}
```

---

### 5.3 Opt-In Profile UI

#### [NEW] `components/settings/ProfileSettings.tsx`

```tsx
"use client"
import { useUserContext } from "@/hooks/useUserContext"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

const AGE_GROUPS = ["youth", "adult", "senior"] as const
const IDENTITY_OPTIONS = ["indigenous", "newcomer", "2slgbtqi+", "veteran", "disability"] as const

export function ProfileSettings() {
  const t = useTranslations("Settings")
  const { context, updateAgeGroup, toggleIdentity, optIn, optOut } = useUserContext()

  if (!context.hasOptedIn) {
    return (
      <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-950">
        <h3 className="mb-2 font-semibold">{t("personalizePrompt")}</h3>
        <p className="text-muted-foreground mb-4 text-sm">{t("personalizeDescription")}</p>
        <Button onClick={optIn}>{t("enablePersonalization")}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <h4 className="mb-2 font-medium">{t("ageGroup")}</h4>
        <div className="flex gap-2">
          {AGE_GROUPS.map((group) => (
            <Button
              key={group}
              variant={context.ageGroup === group ? "default" : "outline"}
              size="sm"
              onClick={() => updateAgeGroup(group)}
            >
              {t(`ageGroups.${group}`)}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-2 font-medium">{t("identities")}</h4>
        <div className="flex flex-wrap gap-2">
          {IDENTITY_OPTIONS.map((id) => (
            <Button
              key={id}
              variant={context.identities.includes(id) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleIdentity(id)}
            >
              {t(`identityTags.${id}`)}
            </Button>
          ))}
        </div>
      </section>

      <Button variant="destructive" onClick={optOut}>
        {t("clearProfile")}
      </Button>
    </div>
  )
}
```

---

#### Localization Keys (`messages/en.json`)

```json
{
  "Settings": {
    "personalizePrompt": "Personalize your results",
    "personalizeDescription": "Optionally share your situation to see services you may qualify for. This data never leaves your device.",
    "enablePersonalization": "Enable Personalization",
    "ageGroup": "Age Group",
    "ageGroups": {
      "youth": "Youth (under 30)",
      "adult": "Adult (18-64)",
      "senior": "Senior (55+)"
    },
    "identities": "I identify as...",
    "identityTags": {
      "indigenous": "Indigenous",
      "newcomer": "Newcomer to Canada",
      "2slgbtqi+": "2SLGBTQI+",
      "veteran": "Veteran",
      "disability": "Person with a disability"
    },
    "clearProfile": "Clear My Profile"
  }
}
```

---

## Phase 6: Data Pipelines (Est. 2-4 Weeks)

### 6.1 211 Ontario API Integration

**Goal**: Automate nightly sync with the official 211 Ontario database.

> [!WARNING]
> 211 API may have rate limits and require a data-sharing agreement. Contact 211 Ontario before implementation.

#### [NEW] `lib/external/211-client.ts`

```typescript
import type { Service } from "@/types/service"

const API_BASE = "https://api.211ontario.ca/v1" // Placeholder URL

interface Raw211Service {
  id: string
  name: string
  description: string
  address: { street: string; city: string; postal: string }
  phone: string
  url: string
  taxonomy: { code: string; name: string }[]
}

export async function fetch211Services(region: string = "Kingston"): Promise<Service[]> {
  const res = await fetch(`${API_BASE}/services?region=${region}`, {
    headers: { Authorization: `Bearer ${process.env.API_211_KEY}` },
    next: { revalidate: 86400 }, // 24h cache
  })

  if (!res.ok) throw new Error(`211 API error: ${res.status}`)

  const raw: Raw211Service[] = await res.json()
  return raw.map(mapToService)
}

function mapToService(raw: Raw211Service): Service {
  return {
    id: `211-${raw.id}`,
    name: raw.name,
    description: raw.description,
    phone: raw.phone,
    url: raw.url,
    address: `${raw.address.street}, ${raw.address.city} ${raw.address.postal}`,
    verification_level: "L2", // Auto-imported
    intent_category: mapTaxonomyToCategory(raw.taxonomy),
    provenance: {
      verified_by: "211 Ontario API",
      verified_at: new Date().toISOString(),
      evidence_url: "https://211ontario.ca",
      method: "Automated Sync",
    },
    synthetic_queries: [],
    identity_tags: [],
  }
}

function mapTaxonomyToCategory(taxonomy: { code: string; name: string }[]): string {
  // Map 211 taxonomy codes to our categories
  const categoryMap: Record<string, string> = {
    BD: "Food",
    BH: "Housing",
    RP: "Crisis",
    // ... extend as needed
  }
  const code = taxonomy[0]?.code.substring(0, 2)
  return categoryMap[code] || "Other"
}
```

---

#### [NEW] `scripts/sync-211.ts`

```typescript
#!/usr/bin/env npx tsx
import { fetch211Services } from "../lib/external/211-client"
import { readFileSync, writeFileSync } from "fs"
import path from "path"

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")

async function main() {
  console.log("🔄 Fetching services from 211 Ontario...")
  const newServices = await fetch211Services()

  const existing = JSON.parse(readFileSync(SERVICES_PATH, "utf-8"))
  const existingIds = new Set(existing.map((s: any) => s.id))

  // Only add new services, don't overwrite manual ones
  const toAdd = newServices.filter((s) => !existingIds.has(s.id))

  if (toAdd.length === 0) {
    console.log("✅ No new services to add.")
    return
  }

  const merged = [...existing, ...toAdd]
  writeFileSync(SERVICES_PATH, JSON.stringify(merged, null, 2))
  console.log(`✅ Added ${toAdd.length} new services.`)
}

main().catch(console.error)
```

---

#### [NEW] `.github/workflows/sync-211.yml`

```yaml
name: Sync 211 Ontario Data

on:
  schedule:
    - cron: "0 4 * * *" # 4 AM UTC daily
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - run: npx tsx scripts/sync-211.ts
        env:
          API_211_KEY: ${{ secrets.API_211_KEY }}

      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore(data): sync 211 Ontario services"
          file_pattern: "data/services.json"
```

---

### 6.2 Service Data Versioning

#### [NEW] `scripts/generate-changelog.ts`

```typescript
#!/usr/bin/env npx tsx
import { execSync } from "child_process"
import { appendFileSync } from "fs"

const diff = execSync("git diff HEAD~1 data/services.json || true", { encoding: "utf-8" })
if (!diff.trim()) process.exit(0)

const date = new Date().toISOString().split("T")[0]
const entry = `\n## ${date}\n\n\`\`\`diff\n${diff.slice(0, 2000)}...\n\`\`\`\n`

appendFileSync("data/changelog.md", entry)
console.log("📝 Changelog updated.")
```

---

### 6.3 Embedding Pre-computation Pipeline

#### [NEW] `scripts/generate-embeddings.ts`

```typescript
#!/usr/bin/env npx tsx
import { pipeline } from "@xenova/transformers"
import { readFileSync, writeFileSync } from "fs"

const MODEL = "Xenova/all-MiniLM-L6-v2"

async function main() {
  console.log("🧠 Loading embedding model...")
  const embedder = await pipeline("feature-extraction", MODEL)

  const services = JSON.parse(readFileSync("data/services.json", "utf-8"))
  const embeddings: Record<string, number[]> = {}

  for (const service of services) {
    const text = `${service.name} ${service.description} ${service.synthetic_queries?.join(" ") || ""}`
    const result = await embedder(text, { pooling: "mean", normalize: true })
    embeddings[service.id] = Array.from(result.data)
    process.stdout.write(".")
  }

  writeFileSync("data/embeddings.json", JSON.stringify(embeddings))
  console.log(`\n✅ Generated embeddings for ${services.length} services.`)
}

main()
```

#### [MODIFY] `package.json`

```json
{
  "scripts": {
    "postbuild": "npx tsx scripts/generate-embeddings.ts"
  }
}
```

---

## Phase 7: Community & Partner Features (Est. 1-2 Months)

### 7.1 Service Submission Form (Public)

#### [NEW] `app/[locale]/submit-service/page.tsx`

```tsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export default function SubmitServicePage() {
  const t = useTranslations("SubmitService")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    const res = await fetch("/api/v1/submissions", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json" },
    })

    setIsSubmitting(false)
    if (res.ok) setSuccess(true)
  }

  if (success) return <p className="text-green-600">{t("successMessage")}</p>

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <input name="name" placeholder={t("serviceName")} required className="w-full rounded border p-2" />
      <textarea name="description" placeholder={t("description")} required className="w-full rounded border p-2" />
      <input name="phone" placeholder={t("phone")} className="w-full rounded border p-2" />
      <input name="url" placeholder={t("website")} type="url" className="w-full rounded border p-2" />
      <input name="address" placeholder={t("address")} className="w-full rounded border p-2" />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  )
}
```

---

#### [NEW] `app/api/v1/submissions/route.ts`

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { z } from "zod"

const SubmissionSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  phone: z.string().optional(),
  url: z.string().url().optional(),
  address: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = SubmissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createClient()
  const { error } = await supabase.from("service_submissions").insert({
    ...parsed.data,
    status: "pending",
    submitted_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}
```

---

### 7.2 Analytics Dashboard for Partners

#### [NEW] `app/[locale]/dashboard/analytics/page.tsx`

```tsx
import { createClient } from "@/lib/supabase"
import { AnalyticsCard } from "@/components/AnalyticsCard"

export default async function PartnerAnalyticsPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from("search_analytics")
    .select("category, result_bucket")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const categoryBreakdown = data?.reduce(
    (acc, row) => {
      acc[row.category || "Other"] = (acc[row.category || "Other"] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
      <AnalyticsCard title="Total Searches (30d)" value={data?.length || 0} />
      <AnalyticsCard title="Top Category" value={Object.keys(categoryBreakdown || {})[0] || "N/A"} />
      <AnalyticsCard
        title="Zero Results %"
        value={`${(((data?.filter((d) => d.result_bucket === "0").length || 0) / (data?.length || 1)) * 100).toFixed(
          1
        )}%`}
      />
    </div>
  )
}
```

---

## Phase 8: Advanced AI (Est. Ongoing)

### 8.1 LLM-Powered Query Expansion

**Goal**: Use a local model to semantically expand user queries before search.

#### [NEW] `lib/ai/query-expander.ts`

```typescript
import { aiEngine } from "./engine"

const EXPANSION_PROMPT = `You are a social services search assistant. Given a user query, output 3-5 related search terms as a JSON array. Only output the array, nothing else.

Query: "{query}"
Related terms:`

export async function expandQuery(query: string): Promise<string[]> {
  try {
    const prompt = EXPANSION_PROMPT.replace("{query}", query)
    const response = await aiEngine.chat([{ role: "user", content: prompt }])
    const parsed = JSON.parse(response)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [] // Fail silently, use original query
  }
}
```

---

### 8.2 Multi-Turn Conversational Memory

#### [MODIFY] `components/ai/ChatAssistant.tsx`

```typescript
// Add session-scoped memory
const [conversationHistory, setConversationHistory] = useState<Message[]>([])

const sendMessage = async (userMessage: string) => {
  const newHistory = [...conversationHistory, { role: "user", content: userMessage }]
  setConversationHistory(newHistory)

  const response = await aiEngine.chat([
    { role: "system", content: systemPrompt },
    ...newHistory.slice(-10), // Keep last 10 messages for context window
  ])

  setConversationHistory([...newHistory, { role: "assistant", content: response }])
}
```

---

### 8.3 Voice Input

#### [NEW] `hooks/useVoiceInput.ts`

```typescript
"use client"
import { useState, useCallback } from "react"

export function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice input not supported in this browser.")
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.lang = "en-CA"
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
    setIsListening(true)
  }, [onResult])

  return { isListening, startListening }
}
```

#### [MODIFY] Search Input

```tsx
import { useVoiceInput } from "@/hooks/useVoiceInput"
import { MicIcon } from "lucide-react"

// In SearchBar component:
const { isListening, startListening } = useVoiceInput(setQuery)

// Add button next to search input:
;<button onClick={startListening} aria-label="Voice search" className="p-2">
  <MicIcon className={isListening ? "animate-pulse text-red-500" : ""} />
</button>
```

---

## Phase 9: Long-Term Backlog

| Item                               | Description                             |
| ---------------------------------- | --------------------------------------- |
| 9.1 Mobile App Expansion           | PWA push notifications, background sync |
| 9.2 Bilingual Completion Audit     | 100% French coverage                    |
| 9.3 Automated Verification Bot     | Phone/URL health checks                 |
| 9.4 Partner Organization Dashboard | CRUD for claimed orgs                   |

---

## Verification Plan

| Phase | Test Type   | Command                                          |
| ----- | ----------- | ------------------------------------------------ |
| 5     | Unit        | `npm test -- tests/eligibility.test.ts`          |
| 5     | E2E         | `npx playwright test --grep "profile settings"`  |
| 6     | Integration | `npm test -- tests/integration/211-sync.test.ts` |
| 6     | Validation  | `npm run validate-embeddings`                    |
| 7     | E2E         | `npx playwright test --grep "submit service"`    |
| 8     | Manual      | Test conversational follow-ups, voice input      |

---

## Timeline Summary

| Phase   | Duration   | Key Deliverables                                  |
| ------- | ---------- | ------------------------------------------------- |
| Phase 5 | 1-2 weeks  | Eligibility checker, identity ranking, profile UI |
| Phase 6 | 2-4 weeks  | 211 sync, versioning, embedding pipeline          |
| Phase 7 | 1-2 months | Submission form, analytics dashboard              |
| Phase 8 | Ongoing    | Query expansion, memory, voice input              |

---

## Risk Mitigation

| Risk                  | Mitigation                                             |
| --------------------- | ------------------------------------------------------ |
| 211 API unavailable   | Fall back to manual JSON; never depend on real-time    |
| LLM hallucinations    | Use for query expansion only, not direct answers       |
| Profile data abuse    | Profile is local-only, opt-in, clearable anytime       |
| Voice API unsupported | Feature-detect and hide button on unsupported browsers |
