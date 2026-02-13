---
status: in-progress
last_updated: 2026-02-12
owner: jer
tags: [roadmap, v20.0, code-quality, testing, i18n]
phase_1a_status: complete
phase_1a_completed: 2026-02-12
phase_1a_commit: ff56b09
phase_1b_status: complete
phase_1b_completed: 2026-02-12
phase_1b_commit: 75285bf
phase_1c_status: complete
phase_1c_completed: 2026-02-12
phase_1c_commit: 6816797
phase_1d_status: complete
phase_1d_completed: 2026-02-12
phase_1d_commit: c272018
phase_1e_status: complete
phase_1e_completed: 2026-02-12
phase_1e_commit: 7cae83e
phase_1f_status: complete
phase_1f_completed: 2026-02-12
phase_1f_tags: v10.0, v15.0, v17.0, v18.0, v19.0
phase_1g_status: complete
phase_1g_completed: 2026-02-12
phase_1g_commit: 3a858f0
phase_1h_status: complete
phase_1h_completed: 2026-02-12
phase_1h_commit: f57aa70
phase_1i_status: complete
phase_1i_completed: 2026-02-12
phase_1i_commit: e18ff97
phase_1j_status: complete
phase_1j_completed: 2026-02-12
phase_1j_commit: 95f8b37
---

# v20.0 Phase 1: Code Quality, Core Test Coverage & Search Enrichment

The first execution sprint of v20.0 (Technical Excellence & Testing). This phase targets
the highest-value autonomous improvements: eliminating code quality blockers, writing tests
for the most critical untested modules, closing i18n gaps, and enriching the search system
with broader crisis and synonym vocabulary.

**Estimated Effort**: 18-25 hours (fully autonomous by AI coding agents)
**Prerequisite**: None — all work is independent of deployment or human intervention.

---

## Current State Summary

**What exists**:

- 196 curated services, 713 passing tests, 53.72% statement coverage (target: 75%)
- v19.0 Phase 1.5 already replaced `console.*` in 7 API routes, but **9 calls remain in hooks + lib/external**
- Dependabot already configured (v19.0 Phase 1.5)
- Crisis keywords: 34 terms (English only, no French)
- Synonyms: ~50 base terms with English+French expansions
- i18n: French fully complete (846/846 keys); **5 other locales each missing 13 keys**
- `z.record(z.any())` in update-request route — loose validation
- Search utility functions `geo.ts`, `fuzzy.ts`, `synonyms.ts` — **zero tests**
- `useRBAC` hook — only untested hook (13/14 tested)
- 3 template files referenced in runbooks but never created

**Key assumptions**:

- Coverage thresholds in `vitest.config.mts` are not currently enforced in CI (checked; `npm test` runs but the global 75% statement threshold would fail). This phase does NOT change enforcement — that is v20.0 Phase 2 (E3).
- The 13 missing i18n keys are UI strings added in v19.0 Phase 2 (User Guide, FAQ, Search hints). They need proper translations, not English placeholders.
- All test files follow existing patterns: `describe`/`it` with `vitest`, `createMockService()` factory, `renderHook()` for hooks.

---

## Phased Implementation Plan

### Phase 1A: Code Quality Quick Fixes ✅ COMPLETE (2026-02-12)

**Goal**: Eliminate all remaining `console.*` calls, harden input validation, remove dead code.

**Deliverables**: Zero `console.*` in hooks/lib, strict field_updates validation, cleaned up eslint-disable markers.

**Actual Effort**: 3h (as estimated)
**Commit**: ff56b09

---

#### [MODIFY] `hooks/useShare.ts`

- **Line 46**: Replace `console.warn("[useShare] Share failed or cancelled", err)` with `logger.warn("[useShare] Share failed or cancelled", { error: err })`
- Add `import { logger } from "@/lib/logger"` at top

#### [MODIFY] `hooks/useServiceFeedback.ts`

- **Line 47**: Replace `console.error("Error fetching feedback stats:", error)` with `logger.error("Error fetching feedback stats", error)`
- Add `import { logger } from "@/lib/logger"`

#### [MODIFY] `hooks/usePushNotifications.ts`

- **Line 29**: Replace `console.warn("[OneSignal] App ID not found.")` with `logger.warn("[OneSignal] App ID not found")`
- **Line 54**: Replace `console.error("[OneSignal] Init failed", err)` with `logger.error("[OneSignal] Init failed", err)`
- **Line 78**: Replace `console.error("[OneSignal] Subscription failed", err)` with `logger.error("[OneSignal] Subscription failed", err)`
- **Line 94**: Replace `console.error("[OneSignal] Unsubscribe failed", err)` with `logger.error("[OneSignal] Unsubscribe failed", err)`
- Add `import { logger } from "@/lib/logger"`

#### [MODIFY] `hooks/useLocalStorage.ts`

- **Line 30**: Replace `console.error(...)` with `logger.error("Error reading localStorage key", error, { key })`
- **Line 49**: Replace `console.error(...)` with `logger.error("Error setting localStorage key", error, { key })`
- Add `import { logger } from "@/lib/logger"`

#### [MODIFY] `lib/external/211-client.ts`

- **Line 40**: Replace `console.warn("⚠️ No API_211_KEY found. using mock data.")` with `logger.warn("No API_211_KEY found, using mock data")`
- Add `import { logger } from "@/lib/logger"`

**Note on `logger` in client-side hooks**: The `lib/logger.ts` module uses `console[level]()` under the hood (structured in production, pretty in dev). It works in both server and client contexts. The benefit is structured metadata and a single logging contract.

---

#### [MODIFY] `app/api/v1/services/[id]/update-request/route.ts`

Replace the loose `z.record(z.any())` schema with an explicit allowlist of updatable fields:

```typescript
const ALLOWED_UPDATE_FIELDS = [
  "name",
  "name_fr",
  "description",
  "description_fr",
  "phone",
  "email",
  "url",
  "address",
  "hours",
  "hours_text",
  "hours_text_fr",
  "eligibility_notes",
  "eligibility_notes_fr",
  "access_script",
  "access_script_fr",
  "coordinates",
  "status",
] as const

const UpdateRequestSchema = z.object({
  field_updates: z.record(
    z.enum(ALLOWED_UPDATE_FIELDS),
    z.union([z.string(), z.number(), z.boolean(), z.null(), z.record(z.unknown())])
  ),
  justification: z.string().max(500).optional(),
})
```

This prevents arbitrary field injection while still allowing legitimate service updates. The value type uses a union covering all realistic service field types.

---

#### [MODIFY] `components/ui/use-toast.ts`

- Remove the `@typescript-eslint/no-unused-vars` disable directive
- Remove the unused `actionTypes` const if truly unused, or prefix with `_` if needed for type inference

#### [MODIFY] `app/[locale]/admin/notifications/page.tsx`

- Remove the block-level eslint-disable/enable for `@typescript-eslint/no-unused-vars`
- Fix the actual unused variable (prefix with `_` or remove)

---

### Phase 1B: i18n Key Backfill ✅ COMPLETE (2026-02-12)

**Goal**: Close the 13-key gap in 5 non-EN/FR locales.

**Deliverables**: All 7 locale files have identical key structure (846 keys each).

**Actual Effort**: 2h (as estimated)
**Commit**: 75285bf

---

#### Missing Keys (identical set in ar, zh-Hans, es, pa, pt)

| Key                                  | English Value                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `UserGuide.title`                    | "User Guide - Kingston Care Connect"                                                      |
| `UserGuide.description`              | "Learn how to use Kingston Care Connect to find local services and support."              |
| `FAQ.title`                          | "FAQ - Kingston Care Connect"                                                             |
| `FAQ.description`                    | "Frequently asked questions about Kingston Care Connect, data verification, and privacy." |
| `Footer.quickLinks.resources`        | "Resources"                                                                               |
| `Footer.quickLinks.userGuide`        | "User Guide"                                                                              |
| `Footer.quickLinks.faq`              | "FAQ"                                                                                     |
| `Search.searchHint`                  | "Try: food bank, mental health, housing, legal aid"                                       |
| `Search.noResultsHelpTitle`          | "Can't find what you need?"                                                               |
| `Search.noResultsHelpBrowse`         | "Browse categories below"                                                                 |
| `Search.noResultsHelpDifferentWords` | "Try different keywords..."                                                               |
| `Search.noResultsHelpCheckSpelling`  | "Check your spelling"                                                                     |
| `Search.noResultsHelpBroaderSearch`  | "Search for a broader topic..."                                                           |

#### [MODIFY] `messages/ar.json`, `messages/zh-Hans.json`, `messages/es.json`, `messages/pa.json`, `messages/pt.json`

- Add all 13 keys with **proper translations** (not English placeholders)
- Translations must respect RTL for Arabic
- Use native script for all locales (Arabic, Simplified Chinese, Spanish, Punjabi, Portuguese)
- Place keys in the same structural position as in `en.json` and `fr.json`

#### Validation

After adding keys, run:

```bash
npm run i18n-audit     # Verify key parity
npm run lint           # Verify JSON structure
npm run type-check     # Verify no broken references
```

---

### Phase 1C: Crisis & Synonym Enrichment ✅ COMPLETE (2026-02-12)

**Goal**: Broaden crisis detection and search vocabulary for better recall and safety.

**Deliverables**: Crisis keywords expanded from 34 to 50; synonym dictionary expanded from 40 to 54 groups.

**Actual Effort**: 3h (as estimated)
**Commit**: 6816797

---

#### [MODIFY] `lib/search/crisis.ts`

Add the following crisis keywords (grouped by category):

**Suicide & self-harm (additions)**:

- `"self-harm"`, `"self harm"` (already has "self harm" — verify no duplicate)
- `"suicidal ideation"`, `"suicidal thoughts"`
- `"self-injury"`, `"self injury"`
- `"hurting myself"`
- `"don't want to live"`, `"dont want to live"`
- `"no reason to live"`
- `"thinking about death"`

**French crisis terms (new category)**:

- `"je veux mourir"` (I want to die)
- `"me tuer"` (kill myself)
- `"me suicider"` (suicide myself)
- `"aide urgente"` (urgent help)
- `"en danger"` (in danger)
- `"violence conjugale"` (domestic violence)
- `"agression sexuelle"` (sexual assault)

**Additional English safety terms**:

- `"human trafficking"`
- `"kidnapped"`
- `"not safe"`
- `"danger"`

**Implementation note**: Each keyword should be lowercase. The `detectCrisis()` function already lowercases the query before matching. Verify no duplicates with existing terms.

---

#### [MODIFY] `lib/search/synonyms.ts`

Add the following synonym groups:

**Housing/Homelessness (expanded)**:

```typescript
unhoused: ["homeless", "shelter", "street", "rough sleeping", "sans-abri"],
eviction: ["evicted", "landlord", "tenant rights", "housing tribunal", "expulsion"],
```

**Financial Aid (expanded)**:

```typescript
cerb: ["ei", "employment insurance", "income support"],
ei: ["employment insurance", "cerb", "benefits", "assurance-emploi"],
tax: ["income tax", "tax clinic", "free tax", "impôts"],
```

**Practical Needs**:

```typescript
id: ["identification", "birth certificate", "ohip", "health card", "sin card"],
transportation: ["bus", "transit", "ride", "accessible transit", "transport"],
childcare: ["daycare", "babysitting", "child care", "garderie"],
clothing: ["clothes", "winter coat", "donation", "vêtements"],
```

**Seniors (expanded)**:

```typescript
"home care": ["caregiver", "personal support worker", "psw", "soins à domicile"],
"assisted living": ["nursing home", "long-term care", "retirement home", "résidence"],
```

**Additional practical expansions**:

```typescript
free: ["no cost", "no charge", "gratuit", "charitable"],
appointment: ["book", "schedule", "walk-in", "rendez-vous"],
interpreter: ["translation", "language help", "interprète"],
```

---

### Phase 1D: Core Test Coverage ✅ COMPLETE (2026-02-12)

**Goal**: Write unit tests for the 4 critical untested modules (search utilities, AI query-expander, and useRBAC hook).

**Deliverables**: 5 new test files, 116 new test cases, coverage increase for `lib/search/**`, `lib/ai/**`, and `hooks/**` modules.

**Actual Effort**: 2.5h (under estimate - tests written efficiently following existing patterns)
**Commits**: c272018 (geo, fuzzy, synonyms, useRBAC), 8215ebc (query-expander)

---

#### [NEW] `tests/lib/search/geo.test.ts`

Test `calculateDistanceKm`, `getProximityMultiplier`, and `resortByDistance` from `lib/search/geo.ts` (113 lines, 4 exports).

**Test cases** (~25 tests):

1. **`calculateDistanceKm`** (Haversine correctness):
   - Same point → 0 km
   - Known distance: Kingston (44.23, -76.49) to Toronto (43.65, -79.38) ≈ 262 km (±5km tolerance)
   - Known distance: Kingston to Ottawa (45.42, -75.69) ≈ 150 km (±5km tolerance)
   - Antipodal points → ~20,000 km
   - Negative longitude handling

2. **`getProximityMultiplier`**:
   - Distance 0 → multiplier 1.0
   - Standard decay at 25km → ~0.67 (1/(1+0.02\*25) = 0.667)
   - Standard decay at 50km → ~0.5 (1/(1+0.02\*50) = 0.5)
   - Wide-area decay at 100km → ~0.667 (1/(1+0.005\*100) = 0.667)
   - Virtual service → always 1.0 regardless of distance
   - Wide-area flag uses reduced decay constant

3. **`resortByDistance`**:
   - Results sorted by adjusted score (descending)
   - Virtual services retain full score
   - Services without coordinates get Infinity distance → multiplier approaches 0
   - "Near You" match reason added when proximity ≥80%
   - "Distance Adjusted" match reason added when proximity <80%
   - No proximity reason added when proximity ≥95%
   - Wide-area scope services use reduced decay
   - Original scores correctly multiplied

**Pattern**: Follow `tests/lib/search/scoring.test.ts` structure with `createMockService()` factory.

---

#### [NEW] `tests/lib/search/fuzzy.test.ts`

Test `getSuggestion` from `lib/search/fuzzy.ts` (105 lines, 1 export + `DICTIONARY` export).

**Test cases** (~20 tests):

1. **Spell correction**:
   - `"houssing"` → `"housing"`
   - `"sheleter"` → `"shelter"`
   - `"emergancy"` → `"emergency"`
   - `"addction"` → `"addiction"`
   - `"suicde"` → `"suicide"`
   - `"prescritpion"` → `"prescription"`

2. **No correction needed**:
   - `"food"` → `null` (exact dictionary match)
   - `"housing"` → `null` (exact match)
   - `"kingscourt"` → `null` (exact match)

3. **Edge cases**:
   - `null` → `null`
   - `""` → `null`
   - `"ab"` → `null` (too short, <3 chars)
   - `"123"` → `null` (numeric, preserved)
   - `"xyzzy"` → `null` (too far from any dictionary word)

4. **Multi-word queries**:
   - `"houssing help"` → `"housing help"` (first word corrected, second preserved)
   - `"food sheleter"` → `"food shelter"` (second word corrected)
   - `"help me"` → `null` (both words correct or too short)

5. **Case insensitivity**:
   - `"HOUSSING"` → `"housing"` (lowercased)
   - `"Housing"` → `null` (already correct)

---

#### [NEW] `tests/lib/search/synonyms.test.ts`

Test `expandQuery` from `lib/search/synonyms.ts` (90 lines, 2 exports).

**Test cases** (~20 tests):

1. **Basic expansion**:
   - `["food"]` → includes `"hungry"`, `"meal"`, `"groceries"`, `"nourriture"`
   - `["housing"]` → includes `"shelter"`, `"homeless"`, `"logement"`
   - `["crisis"]` → includes `"emergency"`, `"suicide"`, `"crise"`

2. **Multi-token expansion**:
   - `["food", "bank"]` → expands food synonyms, keeps "bank"
   - `["mental", "health"]` → expands health synonyms

3. **No expansion**:
   - `["xyzzy"]` → `["xyzzy"]` (unknown term, preserved)
   - `[]` → `[]` (empty input)

4. **Case handling**:
   - `["FOOD"]` → includes food synonyms (lowercased matching)
   - `["Food"]` → includes food synonyms

5. **Deduplication**:
   - `["food", "hungry"]` → no duplicate entries in result
   - Result should be unique set

6. **Identity terms**:
   - `["indigenous"]` → includes `"first nations"`, `"autochtone"`
   - `["lgbt"]` → includes `"queer"`, `"trans"`, `"2slgbtqi+"`
   - `["newcomer"]` → includes `"refugee"`, `"réfugié"`

7. **Abbreviations**:
   - `["ow"]` → includes `"ontario works"`, `"welfare"`
   - `["odsp"]` → includes `"ontario disability"`
   - `["er"]` → includes `"emergency"`, `"hospital"`

---

#### [NEW] `tests/hooks/useRBAC.test.ts`

Test `useRBAC` hook from `hooks/useRBAC.ts` (86 lines, 1 export).

**Test cases** (~20 tests):

1. **Null/undefined role**:
   - `useRBAC(null)` → `permissions` is null, all checks return false, `assignableRoles` is empty
   - `useRBAC(undefined)` → same as null

2. **Owner role**:
   - `isOwner` is true, `isAdmin/isEditor/isViewer` false
   - `isManagerRole` is true
   - `checkPermission("canDeleteOrganization")` → true
   - `checkPermission("canTransferOwnership")` → true
   - `meetsRole("owner")` → true
   - `meetsRole("viewer")` → true
   - `assignableRoles` includes admin, editor, viewer

3. **Admin role**:
   - `isAdmin` true, `isOwner` false
   - `isManagerRole` true
   - `checkPermission("canDeleteOrganization")` → false
   - `checkPermission("canInviteMembers")` → true
   - `meetsRole("admin")` → true
   - `meetsRole("owner")` → false

4. **Editor role**:
   - `checkPermission("canEditOwnServices")` → true
   - `checkPermission("canEditAllServices")` → false
   - `isManagerRole` false

5. **Viewer role**:
   - `checkPermission("canViewServices")` → true
   - `checkPermission("canCreateServices")` → false
   - `isManagerRole` false

6. **Role modification checks**:
   - Owner `canModifyRole("admin", false)` → true
   - Admin `canModifyRole("owner", false)` → false
   - Editor `canModifyRole("viewer", false)` → false
   - Self-modification: `canModifyRole("admin", true)` → depends on role

7. **Member removal**:
   - Owner `canRemoveMember("admin", false)` → true
   - Admin `canRemoveMember("owner", false)` → false
   - Self-removal behavior

8. **Label/description keys**:
   - `roleLabelKey` for owner → `"roles.owner.label"`
   - `roleDescriptionKey` for admin → `"roles.admin.description"`

**Pattern**: Follow `tests/hooks/useGeolocation.test.ts` pattern using `renderHook()` from `@testing-library/react`.

---

### Phase 1E: Documentation Templates ✅ COMPLETE (2026-02-12)

**Goal**: Create the 2 missing template files referenced in runbook documentation.

**Deliverables**: 2 new template files, consistent with existing docs/templates/ structure.

**Actual Effort**: 30min (under estimate)
**Commit**: pending

---

#### [NEW] `docs/templates/post-mortem.md`

Post-incident review template referenced in `docs/runbooks/README.md`. Structure:

- **Header**: Incident title, date, severity, duration, author
- **Summary**: 2-3 sentence incident description
- **Timeline**: Chronological event log (detection → response → resolution)
- **Root Cause**: Technical root cause analysis
- **Impact**: Users affected, services impacted, data loss
- **What Went Well**: Effective response actions
- **What Went Poorly**: Gaps in detection, response, or communication
- **Action Items**: Table with item, owner, due date, status
- **Lessons Learned**: Key takeaways
- **References**: Links to runbooks, alerts, logs

#### [NEW] `docs/templates/runbook-template.md`

Operational runbook template referenced in `docs/runbooks/README.md`. Structure:

- **Header**: Title, severity, MTTR target, last reviewed date
- **Overview**: When this runbook applies
- **Symptoms**: Observable indicators (alerts, errors, user reports)
- **Immediate Actions**: First-response checklist (numbered steps)
- **Diagnosis Steps**: Investigation commands and queries
- **Resolution Procedures**: Fix steps by root cause
- **Verification**: How to confirm the issue is resolved
- **Escalation**: When and how to escalate
- **Prevention**: Long-term fixes to prevent recurrence
- **References**: Related runbooks, ADRs, documentation

---

### Phase 1F: Git Tags ✅ COMPLETE (2026-02-12)

**Goal**: Create semver tags for major milestones to enable proper release tracking.

**Deliverables**: 5 annotated git tags on historical commits.

**Actual Effort**: 15min (under estimate)
**Tags Created**: v10.0 (d5c01ff), v15.0 (051a125), v17.0 (e9cc584), v18.0 (7958626), v19.0 (b231206)

---

#### Tags to Create

| Tag     | Commit Reference                                 | Description              |
| ------- | ------------------------------------------------ | ------------------------ |
| `v15.0` | Commit with "v15.0: Mobile-Ready Infrastructure" | Mobile/offline PWA       |
| `v17.0` | Commit with "v17.0" completion                   | Security & Authorization |
| `v18.0` | Commit with "v18.0" completion                   | Production Observability |
| `v19.0` | Commit `9c4a834` (HEAD of main, 2026-02-10)      | Launch Preparation       |

**Method**: Use `git log --oneline --all` to find exact SHAs, then:

```bash
git tag -a v15.0 <sha> -m "v15.0: Mobile-Ready Infrastructure"
git tag -a v17.0 <sha> -m "v17.0: Security & Authorization"
git tag -a v18.0 <sha> -m "v18.0: Production Observability"
git tag -a v19.0 9c4a834 -m "v19.0: Launch Preparation"
```

Do NOT push tags to remote unless explicitly requested.

---

### Phase 1G: Environment Variable Migration (A4) ✅ COMPLETE (2026-02-12)

**Goal**: Migrate all direct `process.env` access to validated `env` object from `lib/env.ts`.

**Deliverables**: All API routes use type-safe environment variable access through centralized validation.

**Actual Effort**: 1.5h (under 2-3h estimate)
**Commit**: 3a858f0

---

#### Files to Migrate (13 API routes)

**Admin Routes (4 files):**

- `app/api/admin/data/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`
- `app/api/admin/reindex/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`
- `app/api/admin/reindex/status/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`
- `app/api/admin/save/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`

**Health Routes (2 files):**

- `app/api/health/route.ts` - Replace `process.env.NODE_ENV`
- `app/api/v1/health/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`, `process.env.NODE_ENV`

**Service Routes (3 files):**

- `app/api/v1/services/[id]/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*` (PUT, PATCH, DELETE methods)
- `app/api/v1/services/[id]/update-request/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`
- `app/api/v1/services/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`

**Other Routes (4 files):**

- `app/api/v1/analytics/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`
- `app/api/v1/feedback/[id]/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`
- `app/api/v1/metrics/route.ts` - Replace `process.env.NEXT_PUBLIC_SUPABASE_*`, `process.env.NODE_ENV` (GET and DELETE methods)
- `app/api/cron/export-metrics/route.ts` - Replace `process.env.CRON_SECRET`, `process.env.NEXT_PUBLIC_APP_URL`

#### Migration Pattern

**Before:**

```typescript
import { createServerClient } from "@supabase/ssr"

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    cookies: {
      /* ... */
    },
  }
)

if (process.env.NODE_ENV === "production") {
  // production logic
}
```

**After:**

```typescript
import { createServerClient } from "@supabase/ssr"
import { env } from "@/lib/env"

const supabase = createServerClient(
  env.NEXT_PUBLIC_SUPABASE_URL || "",
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  {
    cookies: {
      /* ... */
    },
  }
)

if (env.NODE_ENV === "production") {
  // production logic
}
```

**Benefits:**

- Type-safe environment variable access via Zod schemas
- Centralized validation through `@t3-oss/env-nextjs`
- Eliminates non-null assertions (`!` operator)
- Better error messages when env vars are missing
- Consistent validation across all API routes

---

### Phase 1H: CSV Import Validation Hardening (A5) ✅ COMPLETE (2026-02-12)

**Goal**: Add strict schema validation for CSV service imports to prevent malformed data from reaching the API.

**Deliverables**: Comprehensive CSV validation with detailed error reporting and security hardening.

**Actual Effort**: 2.5h (within 2-3h estimate)
**Commit**: f57aa70

---

#### Files Created/Modified

**New: lib/schemas/service-csv-import.ts (220 lines)**

- `CSVImportRowSchema` - Strict Zod schema for CSV row validation
- `CSV_FIELD_MAPPING` - Header normalization map (30+ common variations)
- `normalizeCSVHeaders()` - Converts varied headers to canonical names
- `validateCSVRow()` - Single row validation with detailed errors
- `validateCSVBatch()` - Batch validation for multiple rows

**Modified: app/[locale]/dashboard/services/import/page.tsx (+168 lines)**

- Replaced `console.*` with `logger.*` (3 instances)
- Added file size validation (5MB max)
- Header normalization using `normalizeCSVHeaders()`
- Full batch validation before preview
- Validation summary UI (valid/invalid counts)
- Field-level error display (max 10 errors shown)
- Visual status indicators per row (✓ or ✗)
- Only import validated rows
- Import summary with success/failure counts
- Enhanced error states and user feedback

**New: tests/lib/schemas/service-csv-import.test.ts (32 tests)**

- Header normalization tests (4 tests)
- Valid data scenarios (6 tests)
- Invalid data rejection (10 tests)
- Validation functions (3 tests)
- Field mapping tests (1 test)
- Edge cases (8 tests)

#### Schema Validation Rules

**Required Fields:**

- `name` - 1-200 characters
- `description` - 10-2000 characters
- `intent_category` - Must be valid category (Food, Crisis, Housing, etc.)

**Contact Method Rules:**

- At least one required: `phone`, `email`, `url`, or `address`
- Crisis services MUST have phone number
- Email: must be valid format
- URL: must be valid format
- Phone: must match pattern `/^[\d\s\-\(\)\+]+$/`

**Optional Fields:**

- `fees` - max 500 chars
- `eligibility` - max 1000 chars
- `hours_text` - max 200 chars
- All empty strings converted to `undefined`

**Security Features:**

- Strict mode: rejects unknown fields
- Type validation: ensures correct data types
- Length limits: prevents oversized inputs
- Format validation: prevents malformed data
- Header normalization: handles varied CSV formats
- Trim whitespace: cleans input data

#### Header Normalization Examples

```typescript
// All these variations map to canonical names:
["Name", "name", "Service Name", "service_name"] → "name"
["Category", "category", "Type", "Intent Category"] → "intent_category"
["Website", "website", "URL", "url", "link"] → "url"
["Phone", "phone", "Telephone", "telephone"] → "phone"
```

#### UI Improvements

**Validation Summary Card:**

- Green card: Valid row count with checkmark icon
- Red card: Invalid row count with alert icon

**Error Display:**

- Shows first 10 validation errors
- Each error displays: row number + field name + error message
- Amber warning styling for visibility

**Data Preview Table:**

- Status column with visual indicators
- Invalid rows highlighted in red
- Empty cells shown as italic "empty"
- Displays first 10 rows

**Import Button:**

- Disabled if no valid rows
- Shows count: "Import N Services"
- Displays "Processing..." during import

#### Security Benefits

1. **SQL Injection Prevention** - Validated fields prevent malicious input
2. **Data Integrity** - Only valid data reaches the API
3. **Format Validation** - Email, URL, phone formats enforced
4. **Required Field Enforcement** - Missing data rejected
5. **Category Validation** - Invalid categories blocked
6. **Contact Method Enforcement** - At least one contact required
7. **Crisis Service Protection** - Phone required for crisis services

---

## Verification Plan

### Automated Tests

After all changes:

```bash
# 1. Lint + type check (must pass — CI blocking)
npm run lint
npm run type-check

# 2. i18n key parity (must show 0 missing keys)
npm run i18n-audit

# 3. Data validation (unchanged — sanity check)
npm run validate-data

# 4. Run full test suite including new tests
npm test

# 5. Run new test files specifically
npx vitest run tests/lib/search/geo.test.ts
npx vitest run tests/lib/search/fuzzy.test.ts
npx vitest run tests/lib/search/synonyms.test.ts
npx vitest run tests/hooks/useRBAC.test.ts

# 6. Coverage check (should show improvement in lib/search/** and hooks/**)
npm run test:coverage

# 7. Build (must succeed — CI blocking)
npm run build
```

### Manual Verification

- [ ] Search for crisis terms (new French: "je veux mourir") — crisis banner appears
- [ ] Search for new synonyms ("childcare", "bus pass") — results returned
- [ ] Spell correction ("houssing") — "Did you mean: housing?" appears
- [ ] Verify no `console.` calls remain in hooks/: `grep -r "console\." hooks/`
- [ ] Verify no `console.` calls remain in lib/external/: `grep -r "console\." lib/external/`

### Expected Coverage Impact

| Path              | Before | After (est.) | Target        |
| ----------------- | ------ | ------------ | ------------- |
| `lib/search/**`   | ~65%   | ~75%         | 65% ✅        |
| `hooks/**`        | ~75%   | ~80%         | 75% ✅        |
| Global statements | 53.72% | ~57-60%      | 75% (not yet) |

**Note**: Reaching the global 75% target requires v20.0 Phase 2 (component smoke tests, B5). This phase focuses on the highest-value modules.

---

## Dependencies

- **None** — all work is independent of deployment, external services, or human decisions.
- New test files depend on existing test infrastructure (`vitest.setup.ts`, `tests/setup/next-mocks.ts`).
- i18n translations should use proper locale-specific text (not machine-translated English).

## Risks & Mitigations

| Risk                                                 | Likelihood | Mitigation                                                                             |
| ---------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| New synonym expansions cause noise in search results | Medium     | Test with `npm run tools:search` before committing; keep expansions conservative       |
| i18n translations are low quality                    | Low        | Use LLM for translation with human-review flag; mark as "machine translated" in commit |
| `useRBAC` test reveals bugs in `lib/rbac.ts`         | Low        | Fix bugs found — that's the point of testing                                           |
| update-request schema change breaks existing clients | Very Low   | No known clients use this endpoint yet (pre-production)                                |
| New crisis keywords cause false positives            | Low        | Keep terms specific; avoid single common words                                         |

### Phase 1I: ESLint Directive Reduction (A2) ✅ COMPLETE (2026-02-12)

**Goal**: Reduce ESLint disable directives from 23 to <10 by improving type safety and eliminating unnecessary type assertions.

**Deliverables**: 48% reduction in ESLint directives (23 → 12), improved type safety across codebase.

**Actual Effort**: 2h (within 4-6h estimate)
**Commit**: e18ff97

---

#### Directives Removed (13 total)

**middleware.ts (1 directive)**

- Added `CookieOptions` type import from `@supabase/ssr`
- Properly typed cookie options in `setAll` function

**hooks/useServices.ts (1 directive)**

- Imported `SupportedLocale` type from `lib/schemas/search`
- Replaced `locale as any` with `locale as SupportedLocale`

**app/api/admin/reindex/route.ts (2 directives)**

- Used `ReturnType<typeof createServerClient>` for supabase client type
- Removed cast on `reindex_progress` insert operation

**components/ui/section.tsx (2 directives)**

- Excluded conflicting event handlers from props type: `onDrag`, `onDragEnd`, `onDragStart`, `onAnimationStart`, `onAnimationEnd`
- Refactored to avoid conditional component type assignment
- Separated className logic from props spreading

**app/api/v1/analytics/route.ts (1 directive)**

- Created `AnalyticsEvent` type for event iteration
- Properly typed `events` array casting

**app/api/v1/services/[id]/summary/route.ts (1 directive)**

- Removed unnecessary double `as any` cast on Supabase query
- Simplified to direct table name string

**components/services/TrustPanel.tsx (1 directive)**

- Used proper `Provenance` type from `types/service.ts`
- Removed `as any` cast on `service.provenance`

**Additional API route cleanups (4 removed, 4 added back)**

- app/api/feedback/route.ts
- app/api/v1/feedback/route.ts
- app/api/v1/notifications/subscribe/route.ts (2)

#### Remaining Directives (12)

**Blocked by Missing Supabase Types (10):**

- `feedback` table (2 directives)
- `push_subscriptions` table (2 directives)
- `organization_invitations` table (1 directive)
- Dashboard page Supabase queries (5 directives)

**Legitimate Cases (2):**

- `react-hooks/exhaustive-deps` in MemberManagement (fetchMembers/fetchInvitations)
- Complex page component with unavoidable type conflict

**Why We Didn't Reach <10:**
The remaining 12 directives require either:

1. Regenerating Supabase types to include all tables (future work)
2. Wrapping Supabase client calls to bypass type checking (not recommended)
3. Refactoring complex components (diminishing returns)

The 48% reduction achieved addresses all "easy wins" and improves type safety across the most critical code paths.

---

### Phase 1J: API Route Test Coverage (B2) ✅ COMPLETE (2026-02-12)

**Goal**: Add comprehensive tests for previously untested API routes to improve API contract coverage.

**Deliverables**: 18 new tests covering update-request and reindex-status routes.

**Actual Effort**: 2h (within 4-6h estimate)
**Commit**: 95f8b37

---

#### Files Created

**New: tests/api/v1/services/update-request.test.ts (9 tests)**

Tests for POST `/api/v1/services/[id]/update-request`:

- Authentication validation (401 if no user)
- Authorization validation (403 if user doesn't own service via AuthorizationError)
- Content-type validation (415 if not application/json)
- Field allowlist enforcement (400 if disallowed fields)
- Required field validation (400 if field_updates missing)
- Valid update submission (200 with all allowed fields)
- Optional justification field handling
- All 18 allowed fields tested (name, name_fr, description, phone, email, url, etc.)
- Database insert failure (500 with error message)

**New: tests/api/admin/reindex-status.test.ts (9 tests)**

Tests for GET `/api/admin/reindex/status`:

- Authentication validation (401 if no user)
- Admin role validation (403 via AuthorizationError if not admin)
- Recent history retrieval (returns last 10 operations when no progressId)
- Specific progress details (with progressId query param)
- 404 handling (if progressId not found)
- Metric calculations:
  - Progress percentage (processed_count / total_services \* 100)
  - Elapsed seconds (for in-progress: now - started_at, for complete: completed_at - started_at)
  - Duration seconds (from progress record)
- Error status with error message
- Edge case: zero total services (prevents division by zero)
- Database query failure (500 with error message)

#### Testing Patterns Used

**Mock Setup:**

- Standard Supabase SSR client mocking via `@supabase/ssr`
- Table chain mocks for query builder pattern
- Authorization helper mocks (`assertServiceOwnership`, `assertAdminRole`)
- Circuit breaker mock (pass-through for these tests)

**Request Handling:**

- Used `createMockRequest` helper with proper headers
- Set `Content-Type: application/json` for all POST requests
- Tested both with and without query parameters

**Assertion Patterns:**

- Response status codes (401, 403, 404, 415, 500, 200)
- Error message format: `json.error.message`
- Success response format: `json.data.*`
- Verified mock function calls with `expect().toHaveBeenCalledWith()`

#### Why Only 2 Routes?

**Routes Already Tested:**

- `/api/v1/services/[id]/printable` - tests/api/v1/services-printable.test.ts (3 tests)
- `/api/v1/services/[id]/summary` - tests/api/v1/services/summary.test.ts (3 tests)

**Routes Newly Tested:**

- `/api/v1/services/[id]/update-request` - NEWLY ADDED (9 tests)
- `/api/admin/reindex/status` - NEWLY ADDED (9 tests)

The task description mentioned 4 routes, but 2 were already tested, so only 2 required new tests.

#### Test Coverage Impact

**Before Phase 1J:**

- 877 tests passing

**After Phase 1J:**

- 895 tests passing (+18)
- All API routes in B2 scope now have test coverage
- API contract coverage significantly improved

---

## Migration Path

No migration needed — all changes are additive or in-place replacements. No API contracts change (the update-request validation is stricter, but the app is pre-production with no external consumers).

---

## Commit Strategy

Follow conventional commits. Suggested commit sequence:

1. `fix: replace console.* with logger in hooks and lib/external` (Phase 1A — logging)
2. `fix: harden update-request validation with explicit field allowlist` (Phase 1A — validation)
3. `chore: remove unused code and eslint-disable directives` (Phase 1A — cleanup)
4. `feat(i18n): add 13 missing keys to ar, zh-Hans, es, pa, pt locales` (Phase 1B)
5. `feat(search): expand crisis keywords with French terms and safety vocabulary` (Phase 1C — crisis)
6. `feat(search): expand synonym dictionary with housing, financial, and practical terms` (Phase 1C — synonyms)
7. `test: add unit tests for geo.ts proximity scoring` (Phase 1D)
8. `test: add unit tests for fuzzy.ts spell correction` (Phase 1D)
9. `test: add unit tests for synonyms.ts query expansion` (Phase 1D)
10. `test: add unit tests for useRBAC hook` (Phase 1D)
11. `docs: add post-mortem and runbook templates` (Phase 1E)
12. `chore: add git tags for v15.0, v17.0, v18.0, v19.0 milestones` (Phase 1F)

---

## Timeline / Milestones

| Phase                      | Effort     | Milestone                                    |
| -------------------------- | ---------- | -------------------------------------------- |
| **1A**: Code quality fixes | 3-4h       | Zero `console.*` in hooks; strict validation |
| **1B**: i18n backfill      | 2-3h       | 846/846 keys in all 7 locales                |
| **1C**: Search enrichment  | 3-4h       | 50+ crisis keywords; ~70 synonym groups      |
| **1D**: Core tests         | 8-12h      | 4 new test files, ~80-100 assertions         |
| **1E**: Doc templates      | 1-2h       | 2 template files created                     |
| **1F**: Git tags           | 30min      | 4 annotated tags                             |
| **Total**                  | **18-25h** |                                              |

Phases 1A-1C can run in parallel (independent changes to different files).
Phase 1D is the largest block and can be parallelized across the 4 test files.
Phases 1E-1F are independent and can run at any time.

---

## What This Phase Does NOT Cover

The following v20.0 items are deferred to Phase 2+:

- **B2**: Tests for untested API routes (printable, summary, update-request, reindex/status)
- **B4-B5**: Component tests (Header, Footer, LanguageSwitcher, 40+ smoke tests)
- **B6**: Fix skipped E2E tests
- **B7**: Error scenario tests
- **A2**: Broader ESLint disable directive reduction (26 → <10)
- **A4**: Migrate direct `process.env` to `lib/env.ts`
- **E2-E6**: CI/CD improvements (security scanning, coverage enforcement, bundle tracking)
- **C2/C5**: French synthetic queries and access_script_fr (requires LLM batch translation)
- **G1-G3**: Architecture improvements (metadata migration, data quality dashboard)
