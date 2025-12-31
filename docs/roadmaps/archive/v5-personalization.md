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

### 7.1 Service Submission System (Crowdsourcing)

**Goal**: Enable community members and organizations to suggest new services or updates, creating a self-healing directory.

#### User Flow

1.  **Entry Point**: "Suggest Service" link in global header/footer.
2.  **Form**: Public `SubmitServicePage` capturing:
    - **Core Info**: Name, Description (min 10 chars).
    - **Contact**: Phone, Website, Address.
    - **Validation**: Strict schema validation using `zod`.
3.  **Submission**:
    - Data POSTed to `/api/v1/submissions`.
    - Stored in `service_submissions` table (status: `pending`).
4.  **Feedback**: Instant success UI with "Submit Another" option.

#### Technical Implementation

**Schema (`types/submission.ts`)**:

```typescript
export const SubmissionSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  phone: z.string().optional(),
  url: z.string().url().optional(),
  address: z.string().optional(),
})
```

**API Route (`app/api/v1/submissions/route.ts`)**:

- **Authentication**: Public (rate-limited in Phase 9).
- **Storage**: Supabase `insert`. mocked fallback if DB unavailable.

---

### 7.2 Partner Analytics Dashboard

**Goal**: Provide value to service providers by showing them demand for their services and general community needs.

#### Dashboard UI (`app/[locale]/dashboard/analytics`)

- **KPI Cards**:
  - `Total Searches`: Volume of intent in the last 30 days.
  - `Top Category`: Most needed service type (e.g., Food, Housing).
  - `Zero Results`: Percentage of searches that found nothing (gap analysis).
- **Trend Indicators**:
  - Visual delta (e.g., "↑ 12%") vs previous period.
  - Color-coded (Green = Growth/Positive, Red = Decline/Negative).

#### Component Architecture

- **`AnalyticsCard.tsx`**: Reusable component supporting:
  - `loading`: Skeleton state for async data fetching.
  - `change`: Numeric trend with automatic color formatting.
  - `description`: Contextual label (e.g., "vs last month").

#### Data Source

- **Real**: Aggregated counts from `search_analytics` table in Supabase.
- **Mock**: Fallback static data for development/preview.

---

## Phase 8: Advanced AI — Voice & Intelligence (Est. 2-3 Weeks)

> **Goal**: Enhance user interaction through voice input and intelligent query understanding, all while maintaining strict **privacy-first** principles (no server-side data egress).

### Executive Summary

Phase 8 introduces two transformative features:

1. **Voice Input**: Allows users to speak their queries instead of typing, dramatically improving accessibility for users with mobility impairments, low literacy, or those in hands-free situations.
2. **LLM Query Expansion**: Uses the existing local AI engine (Phi-3 Mini via `web-llm`) to semantically expand user queries before search, improving recall for vague or underspecified inputs.

Both features run **entirely client-side**, ensuring user privacy is preserved.

---

### 8.1 Voice Input (Speech-to-Text)

### 8.1 Voice Input (Privacy-First)

**Goal**: Enable hands-free search via **100% Local Processing**.

#### 8.1.1 Local-Only Architecture

We have explicitly chosen **NOT** to use the native Web Speech API (Chrome/Edge) because it transmits audio data to Google/Microsoft servers. Instead, we use an in-browser Whisper model for **all users**.

| Technology            | Browsers                                | Privacy          | Notes                                                                        |
| --------------------- | --------------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| **On-Device Whisper** | **All (Chrome, Safari, Firefox, Edge)** | **100% Private** | Runs via WebAssembly (`@xenova/transformers`). Required ~30MB download once. |

**Strategy**:

1. Check for `MediaRecorder` support.
2. Record audio locally.
3. Transcribe audio using the local Whisper model.

#### 8.1.2 User Experience Design

1. **Entry Point**: Microphone icon inside search bar.
2. **First Use**:
   - "Downloading private speech model (30MB)..." tooltip/indicator.
   - Once cached, start-up is instant.
3. **States**:
   - **Idle**: Gray Mic.
   - **Listening**: Red Pulse.
   - **Processing**: "Transcribing..." (Visible processing time for local model).

#### 8.1.3 Technical Implementation

**[NEW] `lib/ai/transcriber.ts`**

- Loads `Xenova/whisper-tiny.en` (Quantized).
- Handles audio conversion.

**[MODIFY] `hooks/useVoiceInput.ts`**

- Removed "Native" mode.
- Forces "Whisper" mode for all browsers.
- Manages local model loading state.

---

### 8.2 LLM Query Expansion

**Goal**: Use the local AI engine to semantically expand vague queries, improving search recall.

#### 8.2.1 Problem Statement

| User Query        | Current Search           | Desired Expansion                                           |
| ----------------- | ------------------------ | ----------------------------------------------------------- |
| "I'm hungry"      | Keyword: "hungry"        | ["food bank", "meal programs", "grocery assistance"]        |
| "help with bills" | Keyword: "bills"         | ["utility assistance", "rent help", "financial aid"]        |
| "mental health"   | Keyword: "mental health" | ["counseling", "therapy", "crisis support", "psychiatrist"] |

#### 8.2.2 Expansion Strategies

1. **Synonym Expansion** (Already Implemented in Phase 3 via `lib/search/synonyms.ts`)
2. **LLM-Based Multi-Query Generation** (New)
3. **Hypothetical Document Embeddings (HyDE)** (Future consideration)

#### 8.2.3 Technical Implementation

**[NEW] `lib/ai/query-expander.ts`**

```typescript
import { aiEngine } from "./engine"

const EXPANSION_PROMPT = `You are a social services search assistant for Kingston, Ontario. Given a user query, generate 3-5 semantically related search terms that would help find relevant community services.

Rules:
- Output ONLY a JSON array of strings, nothing else.
- Include synonyms, related concepts, and specific service types.
- Consider local Canadian terminology (e.g., "ODSP" for disability, "OW" for Ontario Works).

User Query: "{query}"
Related Terms:`

export interface QueryExpansionResult {
  original: string
  expanded: string[]
  fromCache: boolean
}

// Simple in-memory cache to avoid redundant LLM calls
const expansionCache = new Map<string, string[]>()

export async function expandQuery(query: string): Promise<QueryExpansionResult> {
  const normalizedQuery = query.toLowerCase().trim()

  // Check cache first
  if (expansionCache.has(normalizedQuery)) {
    return {
      original: query,
      expanded: expansionCache.get(normalizedQuery)!,
      fromCache: true,
    }
  }

  try {
    // Only expand if AI engine is ready and query is non-trivial
    if (!aiEngine.isReady() || query.length < 3) {
      return { original: query, expanded: [], fromCache: false }
    }

    const prompt = EXPANSION_PROMPT.replace("{query}", query)
    const response = await aiEngine.chat([{ role: "user", content: prompt }])

    // Parse JSON response with fallback
    let parsed: string[]
    try {
      parsed = JSON.parse(response)
      if (!Array.isArray(parsed)) throw new Error("Not an array")
    } catch {
      // Attempt to extract array from response
      const match = response.match(/\[.*\]/s)
      parsed = match ? JSON.parse(match[0]) : []
    }

    // Sanitize results (max 5, no duplicates, no empty strings)
    const sanitized = [...new Set(parsed.filter(Boolean).slice(0, 5))]

    // Cache result
    expansionCache.set(normalizedQuery, sanitized)

    return { original: query, expanded: sanitized, fromCache: false }
  } catch (error) {
    console.warn("[QueryExpander] Failed to expand query:", error)
    return { original: query, expanded: [], fromCache: false }
  }
}

// Clear cache (useful for testing or memory management)
export function clearExpansionCache() {
  expansionCache.clear()
}
```

**[MODIFY] `lib/search/index.ts`**

```typescript
import { expandQuery } from "@/lib/ai/query-expander"

export async function search(query: string, options: SearchOptions): Promise<SearchResult[]> {
  // Step 1: Expand query using LLM (if available)
  let searchTerms = [query]
  if (options.useAIExpansion !== false) {
    const expansion = await expandQuery(query)
    searchTerms = [query, ...expansion.expanded]
  }

  // Step 2: Run hybrid search (keyword + vector) across all terms
  const results = await hybridSearch(searchTerms, options)

  // Step 3: Deduplicate and merge scores
  return deduplicateResults(results)
}
```

#### 8.2.4 User-Facing Transparency

When query expansion is used, optionally display:

```
Searching for: "hungry" + food bank, meal programs, grocery assistance
```

This builds trust by showing users _why_ they're seeing certain results.

---

### 8.3 Multi-Turn Conversational Memory

**Goal**: Allow the Chat Assistant to remember context within a session for follow-up questions.

#### 8.3.1 Conversation Flow Example

| Turn | User                              | Assistant                                                  |
| ---- | --------------------------------- | ---------------------------------------------------------- |
| 1    | "Where can I get free food?"      | "Martha's Table offers free meals Mon-Fri..."              |
| 2    | "What about weekends?"            | "On weekends, you can visit One Roof or Salvation Army..." |
| 3    | "Are any of those near downtown?" | "Martha's Table and Salvation Army are both downtown..."   |

#### 8.3.2 Technical Implementation

**[MODIFY] `components/ai/ChatAssistant.tsx`**

```typescript
interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: number
}

const MAX_CONTEXT_MESSAGES = 10 // Keep last 10 messages in context window
const CONTEXT_EXPIRY_MS = 30 * 60 * 1000 // Clear context after 30 min of inactivity

const [conversationHistory, setConversationHistory] = useState<Message[]>([])
const lastActivityRef = useRef<number>(Date.now())

// Check for stale context on mount
useEffect(() => {
  if (Date.now() - lastActivityRef.current > CONTEXT_EXPIRY_MS) {
    setConversationHistory([])
  }
}, [])

const sendMessage = async (userMessage: string) => {
  lastActivityRef.current = Date.now()

  const newMessage: Message = {
    role: "user",
    content: userMessage,
    timestamp: Date.now(),
  }

  const updatedHistory = [...conversationHistory, newMessage]
  setConversationHistory(updatedHistory)

  // Build context window (system prompt + last N messages)
  const contextWindow = [{ role: "system", content: systemPrompt }, ...updatedHistory.slice(-MAX_CONTEXT_MESSAGES)]

  const response = await aiEngine.chat(contextWindow)

  setConversationHistory([...updatedHistory, { role: "assistant", content: response, timestamp: Date.now() }])
}

// Clear conversation button
const clearConversation = () => {
  setConversationHistory([])
  lastActivityRef.current = Date.now()
}
```

#### 8.3.3 Memory Management

- **Context Window Limit**: Keep only the last 10 messages to stay within the model's token limit (~4k for Phi-3 Mini).
- **Session Expiry**: Auto-clear after 30 minutes of inactivity.
- **Explicit Clear**: "New Conversation" button to reset context.

---

### 8.4 Verification Plan

| Feature               | Test Type   | Method                                                             |
| --------------------- | ----------- | ------------------------------------------------------------------ |
| Voice Input           | Unit        | `tests/hooks/useVoiceInput.test.ts` — mock `SpeechRecognition` API |
| Voice Input           | E2E         | Manual test in Chrome/Safari with real microphone                  |
| Query Expansion       | Unit        | `tests/ai/query-expander.test.ts` — mock AI engine responses       |
| Query Expansion       | Integration | Verify expanded terms appear in search logs                        |
| Conversational Memory | Unit        | `tests/ai/chat-memory.test.ts` — verify context window behavior    |
| Conversational Memory | E2E         | Manual multi-turn conversation test                                |

**Verification Commands**:

```bash
# Unit tests
npm test -- tests/hooks/useVoiceInput.test.ts
npm test -- tests/ai/query-expander.test.ts

# E2E manual checklist
# 1. Click microphone in Chrome → speak "I need food" → verify results appear
# 2. In Safari, verify fallback message appears
# 3. In Chat Assistant, ask follow-up questions → verify context is maintained
```

---

### 8.5 Localization Requirements

| Key                       | English                                   | French                                               |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `VoiceInput.start`        | Start voice search                        | Commencer la recherche vocale                        |
| `VoiceInput.stop`         | Stop listening                            | Arrêter l'écoute                                     |
| `VoiceInput.notSupported` | Voice input not supported in this browser | Entrée vocale non prise en charge dans ce navigateur |
| `VoiceInput.noSpeech`     | No speech detected. Try again.            | Aucune parole détectée. Réessayez.                   |
| `VoiceInput.micDenied`    | Microphone access denied                  | Accès au microphone refusé                           |
| `Chat.newConversation`    | New Conversation                          | Nouvelle conversation                                |
| `Search.expandedFor`      | Also searching for: {terms}               | Recherche également : {terms}                        |

---

### 8.6 File Summary

| Action | Path                                | Description                                    |
| ------ | ----------------------------------- | ---------------------------------------------- |
| NEW    | `hooks/useVoiceInput.ts`            | Voice input hook with full state management    |
| NEW    | `lib/ai/query-expander.ts`          | LLM-based query expansion with caching         |
| MODIFY | `components/search/SearchBar.tsx`   | Add microphone button with states              |
| MODIFY | `components/ai/ChatAssistant.tsx`   | Add conversational memory                      |
| MODIFY | `lib/search/index.ts`               | Integrate query expansion into search pipeline |
| MODIFY | `messages/en.json`                  | Add voice/chat localization keys               |
| MODIFY | `messages/fr.json`                  | Add French translations                        |
| NEW    | `tests/hooks/useVoiceInput.test.ts` | Unit tests for voice hook                      |
| NEW    | `tests/ai/query-expander.test.ts`   | Unit tests for query expansion                 |

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
