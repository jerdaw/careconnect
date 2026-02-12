---
status: in-progress
last_updated: 2026-02-12
owner: jer
tags: [roadmap, v20.0, code-quality, testing, i18n]
phase_1a_status: complete
phase_1a_completed: 2026-02-12
phase_1a_commit: ff56b09
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

### Phase 1B: i18n Key Backfill (2-3h)

**Goal**: Close the 13-key gap in 5 non-EN/FR locales.

**Deliverables**: All 7 locale files have identical key structure (846 keys each).

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

### Phase 1C: Crisis & Synonym Enrichment (3-4h)

**Goal**: Broaden crisis detection and search vocabulary for better recall and safety.

**Deliverables**: Crisis keywords expanded from 34 to 50+; synonym dictionary expanded with housing, financial, and practical terms.

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

### Phase 1D: Core Test Coverage (8-12h)

**Goal**: Write unit tests for the 3 critical untested search utility modules and the `useRBAC` hook.

**Deliverables**: 4 new test files, ~80-100 new test cases, meaningful coverage increase for `lib/search/**` and `hooks/**` thresholds.

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

### Phase 1E: Documentation Templates (1-2h)

**Goal**: Create the 2 missing template files referenced in runbook documentation.

**Deliverables**: 2 new template files, consistent with existing docs/templates/ structure.

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

### Phase 1F: Git Tags (30min)

**Goal**: Create semver tags for major milestones to enable proper release tracking.

**Deliverables**: Git tags on existing commits for key versions.

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
