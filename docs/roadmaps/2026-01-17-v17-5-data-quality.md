---
status: stable
last_updated: 2026-01-23
owner: jer
tags: [roadmap, v17.5, data-quality, verification, enrichment]
---

# v17.5: Data Quality & Enrichment

**Priority:** HIGH
**Estimated Effort:** 3-4 weeks (single developer, data-intensive work)
**Dependencies:** v17.4 (dashboard for data entry), v17.0 (soft deletes for data cleanup)
**Impact:** Search accuracy, completeness, geographic coverage

## Executive Summary

Audit and enrich the service directory (currently 196 services) with missing data needed for **trust**, **accessibility**, and **search accuracy**.

v17.5 implementation work is complete; the remaining items are confirmation/translation tasks tracked in `docs/roadmaps/roadmap.md` under v17.5 follow-ups.

This roadmap is intentionally **architecture-aware**:

- **Source of truth**: `data/services.json` (manual curation).
- **Schema/types**: `types/service.ts` and `lib/schemas/service.ts`.
- **Data enrichment SOP**: `docs/governance/data-enrichment-sop.md` (canonical process + scripts).
- **Key storage conventions**:
  - `scope`: `"kingston" | "ontario" | "canada"` (not “provincial/national” enums).
  - Coordinates: `coordinates: { lat, lng }` (avoid new `latitude`/`longitude` fields).
  - Hours: `hours` uses 24-hour `"HH:MM"` per day; **Open Now** is already implemented in `lib/search/hours.ts`.

### Historical Baseline (Snapshot: 2026-01-21)

Recompute any time with `npm run audit:data` (or a local Node script) before starting a batch.

| Metric                             | Current                  | Notes                                            |
| ---------------------------------- | ------------------------ | ------------------------------------------------ |
| Total services                     | 196                      | Dataset size changes over time                   |
| Missing `scope`                    | 0                        | ✅ Completed (scope is present on all services)  |
| Missing `coordinates` (any)        | 58                       | Includes virtual + confidential + multi-location |
| Missing `coordinates` (required)   | 18                       | Kingston physical services (distance-searchable) |
| Kingston missing `address`         | 17                       | Primary blocker before geocoding can run         |
| Missing `access_script`            | 143                      | Largest remaining accessibility/UX gap           |
| Missing `plain_language_available` | 0                        | ✅ Completed (flag present across dataset)       |
| Missing structured `hours`         | 122                      | Needed for reliable **Open Now**                 |
| Verification distribution          | L1: 121 / L2: 75 / L3: 0 | L3 requires provider confirmation                |

> [!NOTE]
> **Category Expansion** (Phase 7) is moved to ongoing maintenance work rather than a fixed release milestone. Adding new services is continuous, not a one-time task.

### Current Snapshot (Post v17.5 AI Ingestion: 2026-01-23)

Recompute any time with `npm run audit:data` before starting a new batch.

| Metric                              | Current | Notes                                            |
| ----------------------------------- | ------- | ------------------------------------------------ |
| Missing `coordinates` (any)         | 58      | Includes virtual + confidential + multi-location |
| Missing `coordinates` (required)    | 18      | Kingston physical services (distance-searchable) |
| Kingston missing `address`          | 17      | Primary blocker before geocoding can run         |
| Missing `access_script`             | 0       | ✅ v17.5 AI ingestion completed                  |
| Missing structured `hours` (any)    | 11      | Remaining hours require targeted verification    |
| Missing structured `hours` (active) | 10      | Excludes permanently closed records              |
| Missing `hours_text`                | 10      | Backfilled from structured hours where possible  |

Deep Research artifacts used for v17.5:

- Prompt set: `docs/roadmaps/2026-01-21-v17-5-ai-prompts.md`
- Ingestion record (archived): `docs/roadmaps/archive/2026-01-23-v17-5-ai-output-ingestion.md`
- Audit workspace: `docs/roadmaps/v17-5-ai-results/README.md`
- ADR: `docs/adr/011-ai-deep-research-output-ingestion.md`

Coordinates/geocoding workspace (v17.5):

- Workspace: `docs/roadmaps/v17-5-coordinates/README.md`
- Latest gap report: `docs/roadmaps/v17-5-coordinates/reports/coordinate-gap-analysis-2026-01-23.md`

Hours workspace (v17.5):

- Workspace: `docs/roadmaps/v17-5-hours/README.md`
- Gap export: `docs/roadmaps/v17-5-hours/outputs/hours-gaps.json`

### Active Follow-Up Flags (Don’t Lose These)

- **`community-harvest-market` URL/evidence issue (resolved 2026-01-23):** v17.5 evidence spot-check indicated the referenced page returned `404`. The service `url` + provenance were updated to a stable official page, and contact info was re-verified. (See `docs/roadmaps/v17-5-ai-results/reports/evidence-spotcheck-2026-01-22.md` and `docs/roadmaps/v17-5-ai-results/reports/community-harvest-market-followup-2026-01-23.md`.)

## User Review Required

> [!WARNING]
> **Geocoding API Cost**: OpenCage free tier (2,500 calls/day) is sufficient for initial geocoding. If future bulk updates exceed this, consider paid tier (~$50/month for 10,000 calls).

---

## Phase 1: Data Audit & Gap Analysis (2-3 days)

### 1.1 Comprehensive Data Audit

Use the existing audit tooling (see `docs/governance/data-enrichment-sop.md`):

**Run:**

```bash
npm run audit:data
```

**Record the baseline + close-out snapshot** in an audit note so we can quantify improvements at the end of the release:

- `docs/audits/2026-01-23-v17-5-data-quality-summary.md`

### 1.2 Categorized Data Gaps

Optional (but useful): export the gap results to a spreadsheet for batch assignment.

Create spreadsheet with:

- Service name
- Intent Category (`intent_category`)
- Current fields (name, address, phone)
- Missing fields (scope, coordinates, hours)
- Suggested values
- Verification level

**Categories needing expansion:**

Category expansion is not part of the v17.5 close-out. Track ongoing expansion in `docs/roadmaps/roadmap.md` under the v17.5 “Category Expansion” section.

---

## Phase 2: Scope Assignment (2-3 days)

### 2.1 Scope Field & Enum (Already in Architecture)

- `Service.scope` exists in `types/service.ts` as `ServiceScope = "kingston" | "ontario" | "canada"`.
- The UI already supports scope-aware result grouping (Ontario + Canada shown as “provincial”).

### 2.2 Scope Assignment (Completed)

Use the existing script when scope rules change or new services are added:

- Script: `scripts/assign-scopes.ts`

**Status:** v17.5 achieved the desired outcome (`Missing scope: 0`), so we did not re-run scope assignment as part of close-out. Re-run the script only if scope rules change or new services are added.

---

## Phase 3: Geocoding & Coordinates (3-4 days)

### 3.1 Geocoding Setup

**Choose Geocoding Provider:**

| Option        | API Calls (est.) | Cost                       | Accuracy   |
| ------------- | ---------------- | -------------------------- | ---------- |
| Google Maps   | ≤ 25             | Low (but billed)           | ⭐⭐⭐⭐⭐ |
| OpenCage      | ≤ 25             | Free tier (2,500/day)      | ⭐⭐⭐⭐   |
| OSM Nominatim | ≤ 25             | Free (rate-limited/polite) | ⭐⭐⭐     |

**Recommendation:** OpenCage (free tier is sufficient for the remaining coordinate gaps)

### 3.1.1 Current Phase 3 Status (Snapshot: 2026-01-23)

This roadmap treats coordinates as **required only for Kingston-scope, non-virtual services with a stable physical location**.

Artifacts:

- Workspace: `docs/roadmaps/v17-5-coordinates/README.md`
- Gap export: `docs/roadmaps/v17-5-coordinates/outputs/coordinate-gaps.json`
- Analysis note: `docs/roadmaps/v17-5-coordinates/reports/coordinate-gap-analysis-2026-01-23.md`

Current blockers (from `npm run audit:coords`):

- **17** Kingston services missing a verified physical `address` (primary blocker)
- **3** Kingston services with intentional non-geocodable address notes (confidentiality / pop-up / “contact for location”)

### 3.2 Export Coordinate Gaps (Recommended)

This generates a machine-readable report identifying:

- Kingston services missing a verified physical address
- Kingston services with placeholder/non-geocodable address notes (confidentiality, pop-ups)
- Kingston services with a geocodable address but missing coordinates

```bash
npm run audit:coords
```

Output:

- `docs/roadmaps/v17-5-coordinates/outputs/coordinate-gaps.json`

### 3.3 Address Verification (Kingston Physical Services)

Geocoding is only useful once a stable physical `address` exists.

For each Kingston service in `coordinate-gaps.json` with `issues: ["missing_address"]`:

1. Verify the address via a trusted source (official organization website, municipal listing, government directory).
2. Update `data/services.json` `address` to a geocodable physical address.

### 3.3.1 Phase 3 To-Do Checklist (Manual Web Verification + Geocoding Run)

> [!IMPORTANT]
> This is the concrete “what to do next” list for Phase 3.

This work requires web verification and (optionally) a geocoding API key, so it is tracked as a follow-up in `docs/roadmaps/roadmap.md` under v17.5 → “Non-IRL Confirmations (Web Verification)”.

When you are ready:

- Run `npm run audit:coords` and triage `docs/roadmaps/v17-5-coordinates/outputs/coordinate-gaps.json`
- Verify and add missing physical `address` values (do not invent; use `virtual_delivery: true` when appropriate)
- Run geocoding: `OPENCAGE_API_KEY=... npm run geocode`
- Validate + re-audit: `npm run validate-data`, `npm run audit:data`, `npm run audit:coords`

### 3.4 Run the Geocoding Script

Use the existing script, which writes coordinates to `coordinates: { lat, lng }` and caches results in `data/geocode-cache.json`:

```bash
OPENCAGE_API_KEY=xxx node --import tsx scripts/geocode-services.ts
```

**Note:** `scripts/geocode-services.ts` is intentionally conservative and skips:

- non-Kingston scope by default (use `--all-scopes` only if needed)
- `virtual_delivery: true` services
- placeholder address notes (mailing-only, “Various locations”, etc.)

### 3.5 Manual Geocoding

For services that fail automated geocoding (or have no geocodable address):

1. Look up the location in a trusted map source (Google Maps / municipal GIS).
2. Add `coordinates` directly in `data/services.json`:

```json
"coordinates": { "lat": 44.2314, "lng": -76.4860 }
```

---

## Phase 4: Accessibility Metadata (2-3 days)

### 4.1 Access Scripts (Phone Anxiety Support)

**Architecture note:** `access_script` / `access_script_fr` already exist in the schema and are editable via the Partner Portal (`components/partner/ServiceEditForm.tsx`).

**Baseline (pre-2026-01-22):** 143 services missing `access_script` (see `npm run audit:data`).

**Current (post-2026-01-22):** `access_script` coverage is now 196/196 (0 missing) via the v17.5 AI ingestion workflow.

Implementation record:

- [x] Deep Research workflow completed + merged (see `docs/roadmaps/archive/2026-01-23-v17-5-ai-output-ingestion.md`).
- [x] Post-merge audit captured (see `docs/roadmaps/v17-5-ai-results/reports/post-merge-audit-2026-01-22.md`).

Remaining work:

- [x] UI: Add a clearly labeled “What to say when you call” section on the public service detail page (`app/[locale]/service/[id]/page.tsx`) using `next-intl` message keys.
- [x] Governance: run access-script QA audit (length, missing, obvious artifacts) and resolve any issues found.
  - Audit: `npm run audit:access-scripts` → `docs/roadmaps/v17-5-ai-results/reports/access-script-audit.json`
- Follow-up: populate `access_script_fr` (translation-only; no new facts) is tracked in `docs/roadmaps/roadmap.md` under v17.5 → “Bilingual Follow-Up (Access Scripts - French)”.

### 4.3 Plain Language Audit

Use the existing script:

- Script: `scripts/audit-plain-language.ts`
- Baseline status: ✅ `plain_language_available` is already present across the dataset (snapshot: 0 missing)

**Remaining work (to match the current architecture cleanly):**

- [x] Add `plain_language_available?: boolean` to `types/service.ts`
- [x] Add `plain_language_available` to `lib/schemas/service.ts` and `lib/schemas/service-create.ts`
- [x] Decision: treat `plain_language_available` as internal QA metadata for now (no public badge/filter; “Plain Language” view already exists as a layout option).

---

## Phase 5: Hours & Structured Data (2-3 days)

**Architecture note:** The “Open Now” filter already exists and uses `lib/search/hours.ts` against the structured `hours` field.

**Baseline (pre-2026-01-22):** 122 services missing structured `hours` (see `npm run audit:data`).

**Current (post-2026-01-22):** 11 services still missing structured `hours` (any), 10 of which are active services, after v17.5 work (see `npm run audit:data`).

Hours text progress:

- `hours_text` was backfilled from existing structured `hours` for 57 services (no new facts added).
- Remaining missing `hours_text` now aligns with missing structured `hours` (see `npm run audit:hours`).

Implementation record:

- [x] Deep Research workflow completed + merged (see `docs/roadmaps/archive/2026-01-23-v17-5-ai-output-ingestion.md`).
- [x] Post-merge audit captured (see `docs/roadmaps/v17-5-ai-results/reports/post-merge-audit-2026-01-22.md`).

Remaining work:

- Follow-up: resolve remaining missing-`hours` services via manual web verification is tracked in `docs/roadmaps/roadmap.md` under v17.5 → “Non-IRL Confirmations (Web Verification)”.
- [x] Spot-check “Open Now” at different times (including overnight cases) via unit tests (`tests/lib/search/hours.test.ts`).
- [x] Verify printable hours rendering via API unit test (`tests/api/v1/services-printable.test.ts`).

---

## Phase 6: Verification Level Upgrades (2-3 days)

### 6.1 Identify L3 Service Candidates

Workspace (v17.5):

- Workspace: `docs/roadmaps/v17-5-verification/README.md`
- Tracker (manual): `data/verification/l3-candidates.csv`
- Suggestions export (generated): `docs/roadmaps/v17-5-verification/outputs/l3-candidate-suggestions.json`

Generate an initial prioritized list (no data changes):

```bash
npm run audit:l3
```

Track outreach and confirmations in `data/verification/l3-candidates.csv` (do not commit private emails/PII).

**Criteria for L3:**
This work requires provider outreach and is tracked in `docs/roadmaps/roadmap.md` under v17.5 → “IRL Confirmations (Provider Outreach)”.

### 6.2 L3 Partnership Process

1. Identify target: major health/housing/crisis providers
2. Research: locate official intake/communications channel (public email, public phone, official form)
3. Outreach: request provider confirmation of specific fields (hours, address, intake process, eligibility, etc.)
4. Confirm: summarize what was confirmed and when (avoid storing PII or message contents in git)
5. Upgrade: update `verification_level` to `L3` only when confirmation criteria are met
6. Record: update provenance (`verified_at`, `verified_by`, `method`) and store a public `evidence_url` when available

### 6.3 Update Verification Multipliers

**Modify:** `lib/search/scoring.ts`

**Architecture note:** The codebase currently supports `L0`–`L3` only (`types/service.ts`). Treat any `L4` concept as governance-only until explicitly added across types, schemas, UI, and scoring.

If ranking needs tuning after L3 upgrades, adjust the existing weights:

- `WEIGHTS.verificationL3` / `WEIGHTS.verificationL2` / `WEIGHTS.verificationL1`
- `getVerificationMultiplier()`

---

## Phase 7: Category Expansion (ONGOING - Not Part of v17.5)

> [!NOTE]
> Category expansion is moved to **ongoing maintenance** rather than a release milestone. New services should be added continuously as partnerships are formed and needs are identified.

### Ongoing Goals (Post-v17.5)

| Category   | Current | Target | Priority    |
| ---------- | ------- | ------ | ----------- |
| Transport  | 2       | 5+     | Medium      |
| Financial  | 4       | 8+     | High        |
| Indigenous | 3       | 8+     | High (EDIA) |

### Process for Adding New Services

1. **Research**: Identify potential services through community input, partnerships
2. **Verify**: Contact provider, confirm details
3. **Enter via Dashboard**: Use v17.2 partner dashboard for data entry
4. **Review**: Apply L1 verification, schedule L2 follow-up
5. **Monitor**: Track usage in analytics

### Research Areas (for future reference)

**Transport:**

- Paratransit services
- Medical transportation
- Volunteer driver programs

**Financial:**

- Utility bill assistance
- Rent assistance
- Debt counseling

**Indigenous:**

- Indigenous-led health services
- Cultural centers
- Land-based programs

---

## Verification Plan

### Automated Checks

```bash
# Schema validation (Zod)
npm run validate-data

# Data completeness baseline / progress tracking
npm run audit:data
```

### Manual Spot-Check (20% sample)

Manual spot-checking requires web verification and is tracked as a follow-up in `docs/roadmaps/roadmap.md` under v17.5 → “Non-IRL Confirmations (Web Verification)”.

### End-to-End Testing

Automated coverage exists for core flows:

- Crisis ranking/boost: `tests/lib/search/index.test.ts`
- Distance sorting: `tests/lib/search/index.test.ts`
- “Open Now” overnight behavior: `tests/lib/search/hours.test.ts`
- Printable hours rendering: `tests/api/v1/services-printable.test.ts`

---

## Success Criteria

### Core Data Quality (Must Have)

- [x] 100% services have `scope` field (baseline snapshot already achieved)
- Follow-up: 90%+ services have coordinates is tracked in `docs/roadmaps/roadmap.md` under v17.5 → “Non-IRL Confirmations (Web Verification)”
- [x] 70%+ services have structured `hours` (achieved; 184/196 present as of 2026-01-23)
- Follow-up: reduce missing structured hours further is tracked in `docs/roadmaps/roadmap.md` under v17.5 → “Non-IRL Confirmations (Web Verification)”
- [x] Data validation passes all automated checks (`npm run validate-data`)

### Enhanced Metadata (Should Have)

- [x] 100% services have `access_script` (achieved; 196/196 present as of 2026-01-23)
- [x] Public UI surfaces `access_script` on service detail pages (multi-lingual via `next-intl`)
- [x] 100% services have `plain_language_available` flag present (baseline snapshot already achieved)
- [x] Decision: do not expose plain-language status as a badge/filter in v17.5 (keep as internal QA metadata)
- Follow-up: 10+ services at L3 is tracked in `docs/roadmaps/roadmap.md` under v17.5 → “IRL Confirmations (Provider Outreach)”

### Removed from v17.5 (Ongoing Work)

- ~~5+ transport services~~ → Ongoing
- ~~8+ financial services~~ → Ongoing
- ~~8+ indigenous services~~ → Ongoing

---

## Deliverables

- Updated `data/services.json` with all new fields
- `data/geocode-cache.json` local cache for future updates (gitignored)
- L3 outreach tracker: `data/verification/l3-candidates.csv` (PII-free summaries only; do not commit private communications)
- Audit note with before/after metrics (recommended: `docs/audits/v17-5-data-quality-*.md`)
- Updated scripts for future maintenance

---

## Maintenance Plan

After v17.5:

- Monthly staleness audit: identify unverified services
- Quarterly geocode verification: check coordinates still accurate
- Annual verification audit: re-contact L2/L3 providers
