---
status: in_progress
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

This roadmap is intentionally **architecture-aware**:

- **Source of truth**: `data/services.json` (manual curation).
- **Schema/types**: `types/service.ts` and `lib/schemas/service.ts`.
- **Data enrichment SOP**: `docs/governance/data-enrichment-sop.md` (canonical process + scripts).
- **Key storage conventions**:
  - `scope`: `"kingston" | "ontario" | "canada"` (not “provincial/national” enums).
  - Coordinates: `coordinates: { lat, lng }` (avoid new `latitude`/`longitude` fields).
  - Hours: `hours` uses 24-hour `"HH:MM"` per day; **Open Now** is already implemented in `lib/search/hours.ts`.

### Current Baseline (Snapshot: 2026-01-21)

Recompute any time with `npm run audit:data` (or a local Node script) before starting a batch.

| Metric                             | Current                  | Notes                                           |
| ---------------------------------- | ------------------------ | ----------------------------------------------- |
| Total services                     | 196                      | Dataset size changes over time                  |
| Missing `scope`                    | 0                        | ✅ Completed (scope is present on all services) |
| Missing `coordinates`              | 58                       | Primary remaining geo gap                       |
| Missing `access_script`            | 143                      | Largest remaining accessibility/UX gap          |
| Missing `plain_language_available` | 0                        | ✅ Completed (flag present across dataset)      |
| Missing structured `hours`         | 122                      | Needed for reliable **Open Now**                |
| Verification distribution          | L1: 121 / L2: 75 / L3: 0 | L3 requires provider confirmation               |

> [!NOTE]
> **Category Expansion** (Phase 7) is moved to ongoing maintenance work rather than a fixed release milestone. Adding new services is continuous, not a one-time task.

### Current Snapshot (Post v17.5 AI Ingestion: 2026-01-23)

Recompute any time with `npm run audit:data` before starting a new batch.

| Metric                     | Current | Notes                                              |
| -------------------------- | ------- | -------------------------------------------------- |
| Missing `coordinates`      | 58      | Still the primary geo gap                          |
| Missing `access_script`    | 0       | ✅ v17.5 AI ingestion completed                    |
| Missing structured `hours` | 12      | Remaining hours require targeted verification      |
| Missing `hours_text`       | 67      | Many services still need human-readable hours text |

### Active Follow-Up Flags (Don’t Lose These)

- **`community-harvest-market` URL/evidence issue:** v17.5 evidence spot-check indicates the referenced page returns `404`. Update the service `url` to a stable official page and re-verify any hours/access claims before treating the record as verified. (See `docs/roadmaps/v17-5-ai-results/reports/evidence-spotcheck-2026-01-22.md`.)

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

**Record the baseline** in an audit note (recommended: `docs/audit/v17-5-data-quality-baseline.md`) so we can quantify improvements at the end of the release.

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

- [ ] Transport: 2 services (target: 5+)
- [ ] Financial: 4 services (target: 8+)
- [ ] Indigenous: 3 services (target: 8+)

---

## Phase 2: Scope Assignment (2-3 days)

### 2.1 Scope Field & Enum (Already in Architecture)

- `Service.scope` exists in `types/service.ts` as `ServiceScope = "kingston" | "ontario" | "canada"`.
- The UI already supports scope-aware result grouping (Ontario + Canada shown as “provincial”).

### 2.2 Scope Assignment (Completed)

Use the existing script when scope rules change or new services are added:

- Script: `scripts/assign-scopes.ts`

**Verification:**

- [ ] Run script
- [ ] Spot-check 20 random services
- [ ] Verify crisis/telehealth services are `"ontario"` or `"canada"` as appropriate
- [ ] Verify Kingston-address services are `"kingston"`
- [ ] Update any misclassifications manually

---

## Phase 3: Geocoding & Coordinates (3-4 days)

### 3.1 Geocoding Setup

**Choose Geocoding Provider:**

| Option        | API Calls (est.) | Cost                       | Accuracy   |
| ------------- | ---------------- | -------------------------- | ---------- |
| Google Maps   | ≤ 58             | Low (but billed)           | ⭐⭐⭐⭐⭐ |
| OpenCage      | ≤ 58             | Free tier (2,500/day)      | ⭐⭐⭐⭐   |
| OSM Nominatim | ≤ 58             | Free (rate-limited/polite) | ⭐⭐⭐     |

**Recommendation:** OpenCage (free tier is sufficient for the remaining coordinate gaps)

### 3.2 Run the Existing Geocoding Script

Use the existing script, which writes coordinates to `coordinates: { lat, lng }` and caches results in `data/geocode-cache.json`:

```bash
OPENCAGE_API_KEY=xxx npx tsx scripts/geocode-services.ts
```

### 3.3 Manual Geocoding

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

- [x] Deep Research workflow completed + merged (see `docs/roadmaps/2026-01-22-v17-5-ai-output-ingestion.md`).
- [x] Post-merge audit captured (see `docs/roadmaps/v17-5-ai-results/reports/post-merge-audit-2026-01-22.md`).

Remaining work:

- [ ] UI: Add a clearly labeled “What to say when you call” section on the public service detail page (`app/[locale]/service/[id]/page.tsx`) using `next-intl` message keys.
- [ ] Governance: tighten any overly long scripts and resolve any factual issues discovered during spot-checking.
- [ ] Bilingual: plan/implement `access_script_fr` with governance review.

### 4.3 Plain Language Audit

Use the existing script:

- Script: `scripts/audit-plain-language.ts`
- Baseline status: ✅ `plain_language_available` is already present across the dataset (snapshot: 0 missing)

**Remaining work (to match the current architecture cleanly):**

- [ ] Add `plain_language_available?: boolean` to `types/service.ts`
- [ ] Add `plain_language_available` to `lib/schemas/service.ts` and `lib/schemas/service-create.ts`
- [ ] Decide whether this is purely internal QA metadata or a user-facing badge/filter

---

## Phase 5: Hours & Structured Data (2-3 days)

**Architecture note:** The “Open Now” filter already exists and uses `lib/search/hours.ts` against the structured `hours` field.

**Baseline (pre-2026-01-22):** 122 services missing structured `hours` (see `npm run audit:data`).

**Current (post-2026-01-22):** 12 services still missing structured `hours` (184/196 present) after v17.5 AI ingestion.

Implementation record:

- [x] Deep Research workflow completed + merged (see `docs/roadmaps/2026-01-22-v17-5-ai-output-ingestion.md`).
- [x] Post-merge audit captured (see `docs/roadmaps/v17-5-ai-results/reports/post-merge-audit-2026-01-22.md`).

Remaining work:

- [ ] Resolve remaining 12 missing-`hours` services via manual verification or a smaller targeted batch with strict evidence requirements.
- [ ] Spot-check “Open Now” at different times (including overnight crisis cases).
- [ ] Verify printable hours rendering still works (`app/api/v1/services/[id]/printable/route.ts`).

---

## Phase 6: Verification Level Upgrades (2-3 days)

### 6.1 Identify L3 Service Candidates

**New file:** `data/l3-candidates.csv`

Research and identify major providers suitable for L3 status:

```csv
Service,Category,Reason,Contact Status
Kingston General Hospital,health,Major regional provider,Not yet contacted
Addiction Services Kingston,health,Government funded,Not yet contacted
Kingston Shelter,housing,Essential community service,Not yet contacted
...
```

**Criteria for L3:**

- [ ] Official partnership signed
- [ ] Provider-confirmed information
- [ ] Recent verification (within 6 months)
- [ ] Complete service data
- [ ] High impact services

### 6.2 L3 Partnership Process

1. **Identify target:** Major health/housing/crisis providers
2. **Research:** Find decision-maker contact
3. **Outreach:** Email + phone with partnership offer
4. **Verification call:** Confirm all details
5. **Document:** Store verification proof
6. **Upgrade:** Mark as L3

**Template:** `data/l3-partnership-tracker.csv`

```csv
Service,Contact Name,Email,Phone,Status,Verified Date,Notes
KGH,Maria Smith,m.smith@kgh.on.ca,613-548-1232,In progress,2026-01-17,Waiting for callback
...
```

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

- [ ] Random 40 services
- [ ] Verify address on Google Maps
- [ ] Verify phone number calls correct organization
- [ ] Check hours match website
- [ ] Confirm scope assignment makes sense

### End-to-End Testing

- [ ] Search works without scope filter
- [ ] "Open Now" filter returns correct services at 9am
- [ ] Distance calculations correct
- [ ] Crisis services always appear first
- [ ] Geographic scope filters work

---

## Success Criteria

### Core Data Quality (Must Have)

- [x] 100% services have `scope` field (baseline snapshot already achieved)
- [ ] 90%+ services have `coordinates` (target: ≤ 20 missing)
- [ ] 70%+ services have structured `hours` (target: ≤ 59 missing)
- [ ] Data validation passes all automated checks

### Enhanced Metadata (Should Have)

- [ ] 50%+ services have access scripts (target: 100/196)
- [x] 100% services have `plain_language_available` flag present (baseline snapshot already achieved)
- [ ] Decide if/how to expose plain-language status to users (badge/filter)
- [ ] 10+ services at L3 verification level

### Removed from v17.5 (Ongoing Work)

- ~~5+ transport services~~ → Ongoing
- ~~8+ financial services~~ → Ongoing
- ~~8+ indigenous services~~ → Ongoing

---

## Deliverables

- Updated `data/services.json` with all new fields
- `data/geocode-cache.json` local cache for future updates (gitignored)
- L3 outreach tracker (recommended: `docs/governance/` or `docs/audit/`, not `data/`)
- Audit note with before/after metrics (recommended: `docs/audit/v17-5-data-quality-*.md`)
- Updated scripts for future maintenance

---

## Maintenance Plan

After v17.5:

- Monthly staleness audit: identify unverified services
- Quarterly geocode verification: check coordinates still accurate
- Annual verification audit: re-contact L2/L3 providers
