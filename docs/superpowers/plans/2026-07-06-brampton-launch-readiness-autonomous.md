# Brampton Launch Readiness Autonomous Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all reasonable autonomous readiness work for adding Brampton after the multi-city foundation, without promoting unreviewed service data or touching production systems.

**Architecture:** Treat this as a readiness and launch-prep layer on top of the completed multi-city foundation. Produce verified review artifacts, local QA evidence, public-safe docs updates, and Brampton draft candidates while keeping live Kingston behavior unchanged and keeping Brampton service data behind explicit human approval gates.

**Tech Stack:** Next.js 16 App Router, TypeScript strict mode, React 19, Tailwind CSS v4, Radix UI, next-intl, Vitest, Playwright where useful for browser QA, Supabase/PostgreSQL migration files, manually curated JSON service data.

## Global Constraints

- Do not add, modify, or promote live Brampton service records in `data/services.json` without explicit human approval.
- Do not fabricate service names, phone numbers, addresses, hours, eligibility, land acknowledgments, partner relationships, verification status, or service areas.
- Search queries must remain private by design; do not add analytics, user tracking, or query logging.
- Kingston must remain live and searchable throughout all readiness work.
- Brampton can be represented as preview, draft, or launch-ready only when the underlying data state supports that wording.
- Production schema changes, production data writes, deployments, and merges require explicit human approval.
- Public docs must remain boundary-safe and must not include private hostnames, deployment inventory, secret locations, webhook URLs, or production credentials.
- All user-facing copy must be localized in all supported locales: `en`, `fr`, `zh-Hans`, `ar`, `pt`, `es`, `pa`.
- Data-facing work must preserve the L1 minimum launch bar: public/source existence, intake/contact path, target-place availability evidence, and duplicate/canonical review.

---

## Scope Check

This is not a data-entry plan for publishing Brampton. It is an autonomous readiness plan that produces the artifacts and checks needed before a human can approve Brampton records and a production rollout.

The plan covers eight independent but related workstreams:

1. Baseline branch and requirement audit.
2. Browser, responsive, keyboard, and accessibility QA.
3. Full technical verification and regression review.
4. Public positioning and documentation readiness.
5. Brampton draft candidate discovery packet.
6. Duplicate and canonical-service analysis.
7. Local migration and database readiness.
8. Launch packaging, PR notes, rollout checklist, and approval gates.

## File Structure

Create:

- `docs/launch/brampton-readiness-report.md`: final consolidated readiness report with pass/fail status, evidence, and open approval gates.
- `docs/launch/brampton-manual-qa.md`: browser, responsive, keyboard, accessibility, and content QA checklist with observed results.
- `docs/launch/brampton-rollout-checklist.md`: preflight, rollout, smoke test, rollback, and post-launch checks.
- `docs/launch/brampton-pr-description.md`: PR-ready summary, test evidence, risks, and reviewer checklist.
- `data/drafts/brampton-on/candidates/YYYY-MM-DD-core-services.md`: source-linked draft candidate packet for Brampton core services.
- `data/drafts/brampton-on/duplicates/YYYY-MM-DD-canonical-review.md`: duplicate and canonical-service review against existing records.
- `docs/data/brampton-l1-review-template.md`: reusable human review template for converting one draft candidate into a live service record.

Modify only if gaps are found:

- `app/[locale]/page.tsx`: homepage region wording or hero behavior issues.
- `components/home/RotatingRegionHero.tsx`: animation, reduced-motion, or registry sourcing issues.
- `components/home/PlaceSelector.tsx`: transparency, accessibility, or manual override issues.
- `components/home/SearchResultsList.tsx`: selected-place empty-state or scope-filter behavior issues.
- `components/services/ServiceCard.tsx`: coverage badge or place context issues.
- `messages/*.json`: missing or misleading localized copy.
- `docs/**`: Kingston-only public positioning that should become supported-region language.
- `docs/api/openapi.yaml`: place/coverage contract drift.
- `lib/places/**`, `lib/search/**`, `hooks/useSearch.ts`, `hooks/useServices.ts`, API routes, or tests only when verification finds a real defect.

Do not modify unless explicitly approved:

- `data/services.json`
- `data/embeddings.json`
- production environment files
- production Supabase schema or data

## Task 1: Establish Baseline And Approval Boundaries

**Files:**

- Create: `docs/launch/brampton-readiness-report.md`
- Modify: none unless the report path already exists and is for this same readiness pass.

**Interfaces:**

- Consumes: current branch state, existing foundation plan, approved multi-city spec, git history.
- Produces: a baseline report section that later tasks update with evidence and open gates.

- [ ] **Step 1: Confirm branch and worktree state**

Run:

```bash
git status --short --branch
git log --oneline -8
```

Expected: current branch is `codex/multi-city-brampton-foundation`; either clean or only this plan/report work is dirty. If unrelated user changes are present, list them in the report and do not overwrite them.

- [ ] **Step 2: Read the approved foundation artifacts**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-07-06-multi-city-brampton-foundation-design.md
sed -n '1,260p' docs/superpowers/plans/2026-07-06-multi-city-brampton-foundation.md
```

Expected: confirm the approved requirements: Kingston remains live, Brampton is next, selected location is inferred with manual override, launch data can be small L1 core services, verification follows Kingston L1 baseline, and public positioning must become multi-city.

- [ ] **Step 3: Create the readiness report shell**

Create `docs/launch/brampton-readiness-report.md`:

```markdown
# Brampton Launch Readiness Report

Date: 2026-07-06
Branch: codex/multi-city-brampton-foundation

## Status

- Foundation code: not yet reviewed in this readiness pass.
- Kingston live behavior: not yet verified in this readiness pass.
- Brampton preview behavior: not yet verified in this readiness pass.
- Brampton live service data: not added by this autonomous pass.
- Production migration: not applied by this autonomous pass.
- Deployment: not performed by this autonomous pass.

## Approval Gates

- Human approval required before adding records to `data/services.json`.
- Human approval required before changing Brampton from preview/draft language to live language.
- Human approval required before production schema migration.
- Human approval required before deployment or merge.
- Human approval required for land acknowledgment and partner relationship wording.

## Evidence Log

This section will be updated as tasks complete.

## Findings

This section will list defects found and fixed, defects found but deferred, and launch blockers.
```

- [ ] **Step 4: Commit only the report shell if this task is being executed independently**

Run:

```bash
git add docs/launch/brampton-readiness-report.md
git commit -m "docs: start brampton readiness report"
```

Expected: commit succeeds. Skip this commit if batching documentation artifacts in one final readiness commit.

## Task 2: Browser, Responsive, Keyboard, And Accessibility QA

**Files:**

- Create: `docs/launch/brampton-manual-qa.md`
- Modify if defects are found: homepage/search UI files and relevant tests.

**Interfaces:**

- Consumes: app UI, place registry, homepage hero, place selector, search results.
- Produces: manual QA evidence and focused UI fixes if needed.

- [ ] **Step 1: Start a local app without changing service data**

Run:

```bash
npm run dev
```

Expected: local app starts on an available port, normally `http://localhost:3000`. If port `3000` is busy, use the port printed by Next.js.

- [ ] **Step 2: Exercise the homepage on desktop and mobile**

Check:

- The first viewport still makes the project identity obvious.
- The region animation cycles through supported regions.
- Reduced-motion users see stable, non-distracting text.
- Brampton appears as preview or supported-region wording only when accurate.
- The page does not read as Kingston-only.
- Text does not overlap or clip at desktop, tablet, or mobile widths.

Preferred Playwright command:

```bash
npx playwright test tests/e2e/home.spec.ts --project=chromium
```

If no suitable e2e spec exists, use the browser manually and record the exact viewports checked:

- Desktop: 1440 x 900
- Tablet: 768 x 1024
- Mobile: 390 x 844

- [ ] **Step 3: Exercise place selection**

Check:

- Current location inference does not hide the manual override.
- Manual override is transparent and keyboard reachable.
- Kingston selection returns Kingston-local plus broad Ontario/Canada services.
- Brampton selection does not silently show Kingston-local records.
- Empty Brampton results use honest copy and do not imply data exists before curation.

Run targeted tests:

```bash
npm test -- tests/components/home/PlaceSelector.test.tsx tests/components/home/SearchResultsList.test.tsx tests/hooks/useSearch.test.ts tests/hooks/useServices.test.ts --run
```

Expected: all targeted tests pass.

- [ ] **Step 4: Run accessibility checks that are safe locally**

Run:

```bash
npm run test:a11y
```

Expected: no WCAG 2.1 AA blocking issues. If the full a11y command needs a running app, keep the dev server running and rerun.

- [ ] **Step 5: Write the QA report**

Create `docs/launch/brampton-manual-qa.md`:

```markdown
# Brampton Manual QA

Date: 2026-07-06

## Viewports

- Desktop 1440 x 900: record pass/fail result, browser, and notes.
- Tablet 768 x 1024: record pass/fail result, browser, and notes.
- Mobile 390 x 844: record pass/fail result, browser, and notes.

## Homepage Region Animation

- Registry-sourced labels: record pass/fail result and evidence.
- Reduced motion: record pass/fail result and evidence.
- No text overlap: record pass/fail result and evidence.
- Kingston still visible: record pass/fail result and evidence.
- Brampton visible with accurate status: record pass/fail result and evidence.

## Place Selector

- Keyboard reachable: record pass/fail result and evidence.
- Screen-reader label present: record pass/fail result and evidence.
- Manual override visible: record pass/fail result and evidence.
- Kingston behavior verified: record pass/fail result and evidence.
- Brampton behavior verified: record pass/fail result and evidence.

## Search Results

- Kingston local results preserved: record pass/fail result and evidence.
- Broad coverage results included where appropriate: record pass/fail result and evidence.
- Brampton does not show Kingston-only local services: record pass/fail result and evidence.
- Sparse/empty Brampton state is honest: record pass/fail result and evidence.

## Accessibility

- Automated a11y command: record pass/fail result and command output summary.
- Manual keyboard pass: record pass/fail result and evidence.
- Focus order issues: record none found or list each issue with file/component.
- Screen-reader label issues: record none found or list each issue with file/component.

## Fixes Made

- None yet.

## Open Issues

- None yet.
```

- [ ] **Step 6: Fix real UI defects and add regression tests**

Only if defects are found, edit the smallest relevant files and add or update tests. Use existing patterns in:

- `tests/components/home/PlaceSelector.test.tsx`
- `tests/components/home/RotatingRegionHero.test.tsx`
- `tests/components/home/SearchResultsList.test.tsx`

Run:

```bash
npm test -- tests/components/home/PlaceSelector.test.tsx tests/components/home/RotatingRegionHero.test.tsx tests/components/home/SearchResultsList.test.tsx --run
npm run lint
npm run type-check
```

Expected: all pass.

## Task 3: Full Technical Verification And Regression Review

**Files:**

- Modify: `docs/launch/brampton-readiness-report.md`
- Modify code/tests only if real defects are found.

**Interfaces:**

- Consumes: full codebase and branch diff.
- Produces: technical evidence, bug fixes, and an explicit residual-risk list.

- [ ] **Step 1: Inspect branch diff against main**

Run:

```bash
BASE="$(git merge-base HEAD main)"
git diff --stat "$BASE"..HEAD
git diff --name-only "$BASE"..HEAD
```

Expected: diff is scoped to multi-city foundation, docs, tests, migration, and readiness artifacts.

- [ ] **Step 2: Review critical contracts**

Read:

```bash
sed -n '1,220p' lib/places/registry.ts
sed -n '1,220p' lib/places/coverage.ts
sed -n '1,220p' lib/places/selection.ts
sed -n '1,260p' lib/search/index.ts
sed -n '1,260p' lib/search/scoring.ts
sed -n '1,220p' hooks/useSearch.ts
sed -n '1,220p' hooks/useServices.ts
sed -n '1,260p' app/api/v1/search/services/route.ts
sed -n '880,1060p' docs/api/openapi.yaml
```

Confirm:

- `PlaceId` uses stable IDs.
- legacy `scope` remains compatible.
- explicit `coverage` wins over legacy `scope`.
- server and local search both accept selected `placeId`.
- local/regional selected-place services rank ahead of broad services when relevance is comparable.
- OpenAPI matches TypeScript and Zod schemas.
- privacy headers and zero query logging remain intact.

- [ ] **Step 3: Run the expanded targeted test suite**

Run:

```bash
npm test -- tests/lib/places/registry.test.ts tests/lib/places/coverage.test.ts tests/lib/search/index.test.ts tests/hooks/useServices.test.ts tests/api/v1/search-api.test.ts tests/components/home/PlaceSelector.test.tsx tests/components/home/RotatingRegionHero.test.tsx tests/lib/search/map-service-public.test.ts tests/api/v1/services/export.test.ts tests/lib/service-db.test.ts tests/lib/services.test.ts tests/components/ServiceCard.test.tsx tests/components/home/SearchResultsList.test.tsx tests/lib/ai/query-expander.test.ts tests/unit/openapi-pilot-events.test.ts --run
```

Expected: all tests pass.

- [ ] **Step 4: Run core verification commands**

Run:

```bash
npm run lint
npm run type-check
npm run format:check
npm run i18n-audit
npm run check:refs
npm run validate-data
npm run db:validate
npm run check:embeddings
SKIP_EMBEDDINGS=1 npm run build
git diff --check
```

Expected:

- lint passes with zero warnings.
- TypeScript passes.
- formatting passes.
- all seven locale files have consistent keys.
- docs references pass.
- `data/services.json` validates.
- embeddings still match service IDs and dimensions.
- build succeeds with embeddings skipped because service data was not changed.
- no whitespace errors.

- [ ] **Step 5: Record evidence in the readiness report**

Append to `docs/launch/brampton-readiness-report.md`:

```markdown
## Technical Verification

- Branch diff reviewed: record pass/fail result and notable changed areas.
- Targeted Vitest suite: record pass/fail result and test count.
- Lint: record pass/fail result.
- Type check: record pass/fail result.
- Format check: record pass/fail result.
- i18n audit: record pass/fail result and locale count.
- Reference check: record pass/fail result.
- Data validation: record pass/fail result and service count.
- DB validation alias: record pass/fail result and service count.
- Embedding consistency check: record pass/fail result and vector dimensions.
- Build with `SKIP_EMBEDDINGS=1`: record pass/fail result.
- Whitespace diff check: record pass/fail result.

## Technical Residual Risks

- Browser visual QA is tracked separately in `docs/launch/brampton-manual-qa.md`.
- Production migration was not applied.
- Brampton live records were not added.
```

Replace each instruction line with exact pass/fail results during execution.

## Task 4: Public Positioning And Documentation Audit

**Files:**

- Modify: `docs/launch/brampton-readiness-report.md`
- Modify as needed: public docs, homepage copy, partner docs, governance docs, locale messages.

**Interfaces:**

- Consumes: public-facing copy and docs.
- Produces: boundary-safe multi-city positioning and a list of any copy requiring human approval.

- [ ] **Step 1: Search for Kingston-only positioning**

Run:

```bash
rg -n "Kingston|Kingston CareConnect|Kingston Social Services|Kingston-only|supported region|supported place|Brampton|land acknowledgment|partner" app components docs messages README.md
```

Expected: find all public places where Kingston-only copy may need supported-region language.

- [ ] **Step 2: Classify each match**

Use these classifications:

- Keep: historically accurate Kingston-specific content.
- Update: public product positioning should become supported-region language.
- Approval required: land acknowledgment, partner relationship, official relationship, or community-specific wording.
- Private-boundary risk: content that mentions deployment inventory, host details, credentials, private runbooks, or production URLs.

- [ ] **Step 3: Update safe public wording**

Allowed autonomous wording:

```text
CareConnect is a privacy-first social services search tool for supported Ontario communities.
Kingston remains live while Brampton is prepared as the next supported region.
Service records are manually curated and verified before they appear in search.
```

Avoid:

```text
Official municipal service
Government-backed
Partnered with Brampton
Brampton services are live
Complete regional directory
```

unless a source and explicit human approval support the claim.

- [ ] **Step 4: Keep localization complete**

For every user-facing string changed, update all files:

```bash
ls messages/*.json
npm run i18n-audit
```

Expected: all locale files pass with equal key coverage.

- [ ] **Step 5: Record approval-required copy**

Append to `docs/launch/brampton-readiness-report.md`:

```markdown
## Public Positioning Review

### Safe Updates Made

- Record each safe public wording update with file path and reason.

### Human Approval Required

- Land acknowledgment wording: record whether unchanged or list proposed copy requiring approval.
- Partner page relationship wording: record whether unchanged or list proposed copy requiring approval.
- Any copy implying official municipal, regional, provincial, or provider affiliation: record whether removed, avoided, or queued for approval.

### Boundary-Safety Notes

- No private hostnames, credentials, webhook URLs, or deployment inventory were added to public docs.
```

## Task 5: Brampton Draft Candidate Discovery Packet

**Files:**

- Create: `data/drafts/brampton-on/candidates/YYYY-MM-DD-core-services.md`
- Create if missing: `docs/data/brampton-l1-review-template.md`
- Modify: `docs/launch/brampton-readiness-report.md`

**Interfaces:**

- Consumes: public web sources, existing service data, discovery prompt.
- Produces: draft-only Brampton candidate packet with source URLs and review status.

- [ ] **Step 1: Define the autonomous discovery scope**

Use this target set:

- crisis and emergency intervention
- emergency shelter or housing crisis access
- food access
- mental health crisis
- income/social assistance access
- emergency health navigation
- newcomer/refugee support

Hard cap:

- Produce 8 to 15 draft candidates.
- Prefer fewer high-confidence records over broad coverage.
- Drafts remain outside `data/services.json`.

- [ ] **Step 2: Search current public sources**

Because service availability can change, use live web research during execution. Prioritize:

- official provider websites
- 211 Ontario
- municipal or regional public pages
- established community-sector organizations
- provincial/federal program pages for broad services

For each candidate, capture:

- candidate name
- provider/program name
- source URLs
- evidence it serves Brampton
- contact/intake path if clearly sourced
- core-service reason
- possible duplicate signals
- missing facts marked `UNKNOWN`

- [ ] **Step 3: Create the candidate packet**

Create `data/drafts/brampton-on/candidates/YYYY-MM-DD-core-services.md` with this structure:

````markdown
# Brampton Core Services Draft Candidates

Date: YYYY-MM-DD
Status: draft research only

These candidates are not live CareConnect service records. They require L1 review before any record can be added to `data/services.json`.

## Candidate Summary

| Candidate | Category | Coverage Guess | Confidence | L1 Status | Duplicate Risk |
| --------- | -------- | -------------- | ---------- | --------- | -------------- |

Add one row for each researched candidate. Every row must include a source-backed candidate name, category, coverage guess, confidence level, L1 status, and duplicate-risk summary.

## Candidates

### Candidate Entry Format

- Category: source-backed category from the target launch scope.
- Candidate service/program: source-backed program name, or `UNKNOWN` when the source does not name a program.
- Provider: source-backed provider name.
- Coverage draft:

```json
[
  {
    "kind": "local",
    "placeIds": ["brampton-on"],
    "label": "Brampton"
  }
]
```
````

- Why core: one sentence explaining why this belongs in the small launch set.
- Evidence summary: quote-free summary of source evidence that the service exists and serves Brampton or a broader applicable area.
- Known contact:
  - Phone: UNKNOWN
  - URL: UNKNOWN
  - Address: UNKNOWN
- Known access:
  - Hours: UNKNOWN
  - Eligibility: UNKNOWN
  - Access process: UNKNOWN
- Source URLs:
  - include exact public URLs for each material claim.
- Possible duplicates:
  - list matching existing service IDs or write `No obvious match found` with the comparison basis.
- L1 review checks:
  - confirm source URL loads
  - confirm phone or intake path
  - confirm availability to Brampton
  - confirm no canonical duplicate should be reused instead

````

The finished artifact must contain actual candidate entries and no blank fields.

- [ ] **Step 4: Create the L1 review template**

Create `docs/data/brampton-l1-review-template.md`:

```markdown
# Brampton L1 Review Template

Use this template before adding any Brampton candidate to `data/services.json`.

## Candidate

- Candidate name:
- Provider/program:
- Draft source file:
- Reviewer:
- Review date:

## Required L1 Checks

- [ ] Official/source URL loads.
- [ ] The service or program exists.
- [ ] The candidate serves Brampton or has clearly applicable broad coverage.
- [ ] Phone, URL, address, or intake path is copied only from a cited source.
- [ ] Unknown facts remain blank or `UNKNOWN`; they are not inferred.
- [ ] Duplicate/canonical review completed.
- [ ] Verification level is no higher than L1 unless direct provider confirmation supports L2/L3.
- [ ] Public wording does not imply a partnership or official relationship.

## Coverage Decision

Use one:

```json
[{ "kind": "local", "placeIds": ["brampton-on"], "label": "Brampton" }]
````

```json
[{ "kind": "regional", "placeIds": ["brampton-on"], "regionIds": ["peel-region"], "label": "Peel Region" }]
```

```json
[{ "kind": "provincial", "label": "Ontario-wide" }]
```

```json
[{ "kind": "national", "label": "Canada-wide" }]
```

## Decision

- [ ] Approved for live data entry
- [ ] Needs more research
- [ ] Reject
- [ ] Reuse or update canonical existing record instead

## Notes

````

- [ ] **Step 5: Validate no live data changed**

Run:

```bash
git diff -- data/services.json data/embeddings.json
````

Expected: no output.

## Task 6: Duplicate And Canonical-Service Analysis

**Files:**

- Create: `data/drafts/brampton-on/duplicates/YYYY-MM-DD-canonical-review.md`
- Modify: `docs/launch/brampton-readiness-report.md`

**Interfaces:**

- Consumes: Brampton draft candidates and existing `data/services.json`.
- Produces: canonicalization decisions that prevent bad duplicates.

- [ ] **Step 1: Extract existing service identifiers**

Run:

```bash
node --import tsx -e "import services from './data/services.json' with { type: 'json' }; for (const service of services) console.log([service.id, service.name, service.phone ?? '', service.url ?? '', service.scope ?? '', service.primary_place_id ?? ''].join('\\t'))"
```

Expected: tab-separated list of current services for duplicate comparison.

- [ ] **Step 2: Compare candidates against existing records**

For each Brampton draft candidate, check:

- same provider name
- same program name
- same phone number
- same URL/domain
- same address
- same broad service area
- same provincial or national program

Decision options:

- New local Brampton record.
- Existing record should gain Brampton coverage later, with human approval.
- Existing broad record should be reused, no duplicate needed.
- Candidate rejected as duplicate or insufficiently sourced.

- [ ] **Step 3: Create canonical review artifact**

Create `data/drafts/brampton-on/duplicates/YYYY-MM-DD-canonical-review.md`:

```markdown
# Brampton Canonical And Duplicate Review

Date: YYYY-MM-DD
Status: draft analysis only

## Decision Summary

| Candidate | Decision | Existing Match | Reason | Human Approval Needed |
| --------- | -------- | -------------- | ------ | --------------------- |

Add one row per draft candidate. Every row must include the recommended canonical decision, any existing match, the reason, and whether human approval is required.

## Candidate Reviews

### Candidate Review Format

- Draft candidate source: path to the candidate entry in the draft packet.
- Duplicate signals:
  - Same provider: yes/no plus existing service ID when relevant.
  - Same phone: yes/no plus existing service ID when relevant.
  - Same URL/domain: yes/no plus existing service ID when relevant.
  - Same address: yes/no plus existing service ID when relevant.
  - Same service area: yes/no plus existing service ID when relevant.
- Recommended canonical decision: choose one of the decision options listed in Step 2.
- Required human check before live data: list the exact unresolved verification questions.
```

The finished artifact must contain actual candidate reviews and no blank fields.

- [ ] **Step 4: Confirm no duplicate decision changed live data**

Run:

```bash
git diff -- data/services.json data/embeddings.json
```

Expected: no output.

## Task 7: Local Migration And Database Readiness

**Files:**

- Modify: `docs/launch/brampton-readiness-report.md`
- Modify migration or DB mapping tests only if defects are found.

**Interfaces:**

- Consumes: Supabase migration file and DB mapping code.
- Produces: local DB readiness evidence and production preflight checklist.

- [ ] **Step 1: Inspect migration for local safety and public view shape**

Run:

```bash
sed -n '1,260p' supabase/migrations/20260706120000_add_service_coverage_place_fields.sql
sed -n '1,260p' lib/service-db.ts
sed -n '1,220p' lib/search/map-service-public.ts
```

Confirm:

- migration adds `primary_place_id` and `coverage` without destructive data loss.
- public views expose only public-safe fields.
- DB mapping preserves coverage and place fields.
- local JSON fallback still works if Supabase is unavailable.

- [ ] **Step 2: Run DB mapping and export tests**

Run:

```bash
npm test -- tests/lib/service-db.test.ts tests/lib/services.test.ts tests/lib/search/map-service-public.test.ts tests/api/v1/services/export.test.ts tests/api/v1/search-api.test.ts --run
```

Expected: all pass.

- [ ] **Step 3: Run local Supabase DB tests only if the disposable stack is available**

Run:

```bash
npm run test:db:smoke
```

Expected: pass against local disposable Supabase. If Docker or local Supabase is unavailable, record it as "not run: local dependency unavailable" in the readiness report.

- [ ] **Step 4: Write production preflight checklist without applying it**

Append to `docs/launch/brampton-rollout-checklist.md` or create it if Task 8 has not yet created it:

```markdown
## Production Database Preflight

- [ ] Confirm target environment and project ID through approved private/shared operations source of truth.
- [ ] Run read-only live schema inspection for `services`, public service views, indexes, and RLS policies.
- [ ] Confirm existing live columns match migration assumptions.
- [ ] Confirm backup or rollback posture.
- [ ] Apply migration only after explicit human approval.
- [ ] Run post-migration read-only checks for `primary_place_id`, `coverage`, public views, and search API.
```

Do not run production SQL in this autonomous plan.

## Task 8: Launch Packaging, Rollout Checklist, And PR Notes

**Files:**

- Create: `docs/launch/brampton-rollout-checklist.md`
- Create: `docs/launch/brampton-pr-description.md`
- Modify: `docs/launch/brampton-readiness-report.md`

**Interfaces:**

- Consumes: all prior task evidence.
- Produces: final launch package that a human can review, merge, and deploy from.

- [ ] **Step 1: Create rollout checklist**

Create `docs/launch/brampton-rollout-checklist.md`:

```markdown
# Brampton Rollout Checklist

## Pre-Merge

- [ ] Foundation branch reviewed.
- [ ] Technical verification passed.
- [ ] Browser and accessibility QA passed or documented.
- [ ] Public positioning reviewed.
- [ ] Brampton draft candidates prepared.
- [ ] Duplicate/canonical review prepared.
- [ ] No Brampton records added to live data without approval.
- [ ] No production migration applied without approval.

## Human Approval Gates

- [ ] Approve first Brampton L1 records for `data/services.json`.
- [ ] Approve any land acknowledgment changes.
- [ ] Approve any partner or official relationship wording.
- [ ] Approve production migration.
- [ ] Approve deploy/merge.

## Data Launch After Approval

- [ ] Add approved Brampton records to `data/services.json`.
- [ ] Run `npm run validate-data`.
- [ ] Run `npm run db:validate`.
- [ ] Run `npm run build` to regenerate embeddings.
- [ ] Run `npm run check:embeddings`.
- [ ] Run search QA for Kingston and Brampton.
- [ ] Commit data and embeddings together.

## Production Rollout After Approval

- [ ] Inspect private/shared operations source of truth for environment and release instructions.
- [ ] Perform read-only production schema preflight.
- [ ] Apply migration.
- [ ] Deploy application.
- [ ] Smoke test Kingston search.
- [ ] Smoke test Brampton selected-place behavior.
- [ ] Smoke test broad Ontario/Canada services.
- [ ] Confirm no user search logging was introduced.

## Rollback

- [ ] Revert application deployment to prior release.
- [ ] If data records caused the issue, remove or correct the approved Brampton records in a follow-up data commit.
- [ ] Do not roll back production schema without explicit database rollback approval.

## Post-Launch

- [ ] Monitor feedback channels.
- [ ] Queue L2/L3 verification candidates.
- [ ] Expand Brampton only through the same L1 review workflow.
```

- [ ] **Step 2: Create PR description artifact**

Create `docs/launch/brampton-pr-description.md`:

```markdown
# PR Description: Brampton Multi-City Launch Readiness

## Summary

- Keeps Kingston live.
- Adds or verifies Brampton-ready multi-city foundations.
- Preserves manual curation and L1 launch gates.
- Adds launch readiness, QA, draft candidate, duplicate review, and rollout artifacts.

## Data Governance

- No fabricated service data.
- No Brampton records promoted to live search in this autonomous pass.
- Draft candidates remain in `data/drafts/brampton-on`.
- Human approval is required before service data changes.

## Verification

- `npm test -- ...`: record pass/fail result and test count.
- `npm run lint`: record pass/fail result.
- `npm run type-check`: record pass/fail result.
- `npm run format:check`: record pass/fail result.
- `npm run i18n-audit`: record pass/fail result and locale count.
- `npm run check:refs`: record pass/fail result.
- `npm run validate-data`: record pass/fail result and service count.
- `npm run db:validate`: record pass/fail result and service count.
- `npm run check:embeddings`: record pass/fail result and vector dimensions.
- `SKIP_EMBEDDINGS=1 npm run build`: record pass/fail result.
- Browser/manual QA: record pass/fail result and report path.

## Rollout Notes

- Production migration requires explicit approval and read-only schema preflight.
- Deployment requires explicit approval.
- Brampton should not be positioned as live until approved L1 records are added.

## Reviewer Checklist

- [ ] Location selector behavior is transparent.
- [ ] Kingston behavior remains intact.
- [ ] Brampton preview behavior is honest.
- [ ] Coverage contracts are consistent across TypeScript, Zod, OpenAPI, DB mapping, and UI.
- [ ] Public docs do not imply official partnerships.
- [ ] Draft service candidates are not live data.
```

Replace each instruction line with exact verification evidence after Task 3 and Task 2 complete.

- [ ] **Step 3: Final report update**

Append to `docs/launch/brampton-readiness-report.md`:

```markdown
## Final Readiness Decision

- Ready to merge foundation code: record yes/no after all verification tasks complete.
- Ready to publish Brampton live records: no, requires human-approved L1 records
- Ready for production migration: no, requires human approval and live schema preflight
- Ready for deployment: no, requires human approval

## Recommended Next Human Decisions

1. Review Brampton draft candidates.
2. Choose the first approved L1 records.
3. Approve or revise public positioning language.
4. Decide whether to run production migration and deploy.
```

- [ ] **Step 4: Final verification before handoff**

Run:

```bash
npm run lint
npm run type-check
npm run format:check
npm run check:refs
git status --short --branch
```

Expected: commands pass and only intended readiness artifacts or associated fixes are changed.

- [ ] **Step 5: Commit readiness package**

Run:

```bash
git add docs/launch data/drafts/brampton-on docs/data/brampton-l1-review-template.md
git commit -m "docs: add brampton launch readiness package"
```

If code fixes were required, commit them separately before this documentation package with a `fix:` message and include the test evidence in the report.

## Autonomous Execution Boundaries

The agent may complete these without additional approval:

- run local tests, linting, type checking, build checks, reference checks, and local a11y checks.
- start and stop local development servers.
- perform browser/manual QA against localhost.
- search public web sources for Brampton draft candidates.
- create draft candidate and duplicate-review artifacts under `data/drafts/brampton-on`.
- update public-safe docs and copy where the wording does not imply official relationships.
- fix defects found in the multi-city foundation when the fix does not change live service data, production systems, RBAC, or secrets.

The agent must stop for explicit approval before:

- editing `data/services.json`.
- regenerating `data/embeddings.json` because of new or changed service records.
- changing Brampton from preview/draft language to live language.
- applying production migrations.
- changing production environment variables.
- deploying, merging, or pushing to production.
- publishing land acknowledgment changes.
- publishing partner, official relationship, or endorsement language.

## Self-Review

- Spec coverage: this plan covers visual QA, technical verification, Brampton draft discovery, duplicate/canonical analysis, public positioning/docs, local migration readiness, and launch packaging.
- Placeholder scan: artifact templates define required fields and completion rules; final execution must leave no blank candidate, QA, verification, or decision fields.
- Type consistency: coverage examples use the implemented `ServiceCoverageArea` shape with `kind`, `placeIds`, optional `regionIds`, and `label`.
