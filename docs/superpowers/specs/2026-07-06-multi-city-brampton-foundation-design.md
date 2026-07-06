# Multi-City Foundation And Brampton Launch Design

**Date:** 2026-07-06  
**Status:** Draft for user review  
**Owner:** jer  
**Scope:** CareConnect public app, service data contract, search behavior, curation workflow, and public positioning

## 1. Context

CareConnect began as a Kingston-focused, privacy-first social services search engine. The current public positioning, homepage, documentation, and some schema names still assume Kingston as the single local context. The runtime service model has `scope?: "kingston" | "ontario" | "canada"`, plus fields such as `service_area`, `virtual_delivery`, coordinates, and province-wide badges.

The next expansion target is Brampton, Ontario. Kingston must remain live while Brampton is added. The project should not become a generic Ontario directory in this phase. The implementation should support small city-by-city growth, starting with a high-confidence Brampton emergency/core-services set and expanding only as curation capacity allows.

The main design choice is to replace hard-coded city scope with a small place registry and service coverage model. Brampton should be the next concrete place in that registry, but the architecture should support later additions such as Peel Region without another data-contract rewrite.

## 2. Goals

1. Add Brampton as the next supported local search context while keeping Kingston live.
2. Keep launch scope small: emergency and core services first, with L1 or higher verification.
3. Let users see and control their selected location. Location may be inferred, but the choice must be transparent and manually overrideable.
4. Preserve privacy-first behavior: no IP-based location inference, no search-query logging, and no tracking-based personalization.
5. Prevent duplicate service records as the project expands across cities and regions.
6. Make public copy city-aware instead of Kingston-branded.
7. Keep the implementation compatible with local JSON, Supabase runtime reads, offline export, IndexedDB, and server search.

## 3. Non-Goals

1. Do not launch a broad Peel, GTA, or Ontario directory in this phase.
2. Do not auto-publish AI-discovered Brampton services.
3. Do not import 211 data directly into visible records without the CareConnect review workflow.
4. Do not change production schema or data until a read-only live-schema preflight confirms the expected runtime contract.
5. Do not rewrite the entire service schema into a full branch/location/provider platform unless the narrower coverage model proves insufficient.

## 4. Recommended Architecture

Use a **City Registry + Coverage Model**.

### 4.1 Places

Introduce a place registry as a typed source of truth in application code, backed by a DB-compatible identifier.

Initial places:

| Place ID      | Name     | Province | Country | Launch Role        |
| ------------- | -------- | -------- | ------- | ------------------ |
| `kingston-on` | Kingston | Ontario  | Canada  | Existing live city |
| `brampton-on` | Brampton | Ontario  | Canada  | Next launch city   |

The registry should include:

1. stable `id`,
2. display name,
3. province/country,
4. approximate centroid for distance defaults,
5. optional bounding box or polygon for browser-geolocation inference,
6. launch status such as `live`, `preview`, or `hidden`,
7. public copy fields where needed, such as local description and source notes.

The first implementation can keep this registry in code, for example `lib/places/registry.ts`, with matching Zod validation. A future DB-backed `places` table can be added when place management becomes operationally meaningful.

### 4.2 Service Coverage

Replace the narrow `scope` enum as the primary city model. Services should express where they are available through coverage metadata.

Recommended service fields:

```ts
type ServiceCoverageKind = "local" | "regional" | "provincial" | "national"

interface ServiceCoverageArea {
  kind: ServiceCoverageKind
  placeIds?: string[]
  regionIds?: string[]
  label?: string
  notes?: string
}

interface Service {
  coverage?: ServiceCoverageArea[]
  primary_place_id?: string
}
```

Compatibility rules:

1. Existing `scope: "kingston"` maps to `coverage: [{ kind: "local", placeIds: ["kingston-on"] }]`.
2. Existing `scope: "ontario"` maps to `coverage: [{ kind: "provincial", label: "Ontario-wide" }]`.
3. Existing `scope: "canada"` maps to `coverage: [{ kind: "national", label: "Canada-wide" }]`.
4. `service_area` remains human-readable supporting text.
5. `coordinates` continue to describe a physical location, not eligibility coverage.
6. `virtual_delivery` continues to mean the user can access the service without visiting a physical site.

The implementation may keep `scope` temporarily as a derived or legacy field for compatibility, but new logic should read coverage.

### 4.3 Canonical Service Identity

To avoid bad duplicates, separate service identity from place availability.

Rules:

1. One canonical record per real service program when the same program serves multiple places through the same contact/intake path.
2. Separate records when different branches have distinct hours, phone numbers, addresses, intake rules, or eligibility.
3. Use `primary_place_id` for the main physical city when a record has a physical office.
4. Use `coverage` for where the service is available.
5. Use `service_area` for user-readable nuance such as "serves Brampton and Mississauga residents" after that statement is verified.

Examples:

1. A Canada-wide crisis line should be one record with national coverage.
2. An Ontario-wide benefits information line should be one record with provincial coverage.
3. A provider with a Brampton office and a Kingston office should be one organization conceptually, but separate service records if the user-facing contact details or access steps differ.
4. A Peel-wide program based in Mississauga but serving Brampton should not be copied as a fake Brampton address. It should have regional coverage and clear service-area text.

## 5. Search Behavior

### 5.1 Selected Place

The app should maintain a selected place state. Search should use the selected place to filter and rank services.

Initial selection priority:

1. User's manual selection stored locally on the device.
2. Browser geolocation if the user explicitly grants permission and the coordinates match a supported place area.
3. A visible default prompt or default city, initially Kingston until Brampton is ready for public launch.

No IP-based inference should be used.

### 5.2 Transparent Override

The homepage search controls should include a location/place control that clearly states the active context, for example:

1. "Showing Brampton"
2. "Change city"
3. "Use my location"
4. "Showing Kingston"

The control must be keyboard accessible, screen-reader understandable, and usable without geolocation permission.

### 5.3 Filtering And Ranking

When the selected place is Brampton:

1. Include services with local Brampton coverage.
2. Include regional services that explicitly cover Brampton.
3. Include Ontario-wide and Canada-wide services.
4. Exclude Kingston-only services unless the user switches to Kingston or uses a future "all cities" research/admin mode.
5. Rank local/core Brampton services ahead of broad services when relevance is comparable.
6. Keep crisis override behavior deterministic and ensure emergency services stay prominent.

When no selected place is available:

1. Search may show broad provincial/national emergency resources.
2. The UI should ask the user to choose a city for local results.
3. The app should avoid implying complete local coverage.

### 5.4 Server Search Contract

Extend the search API request schema to accept a selected place:

```ts
filters: {
  category?: string
  openNow?: boolean
  placeId?: string
}
```

Server search should not log raw query text or precise location. Existing no-store cache behavior should continue for query, location, open-now, and place-filtered searches unless a category-only anonymous browse case remains safe to cache.

## 6. Brampton Launch Data Strategy

### 6.1 Minimum Dataset

Brampton launch should start with a small high-confidence set:

1. emergency and crisis lines,
2. food access,
3. shelter/housing access,
4. municipal or regional social assistance access points,
5. health/navigation services that are clearly available to Brampton residents,
6. Ontario-wide and Canada-wide crisis resources already in the directory.

The launch dataset should prioritize correctness over count. A small set of verified records is acceptable.

### 6.2 Verification Standard

Visible Brampton records must be L1 or higher and within the active freshness window.

For L1:

1. official website loads or official page exists,
2. public phone or intake path is present where relevant,
3. service area or eligibility supports Brampton residents,
4. provenance includes evidence URL and verification date,
5. crisis services include a phone or immediate contact path.

L2 is not required for initial Brampton launch, but should be preferred for high-risk records when minimal human verification is feasible.

### 6.3 AI-Assisted Curation

AI may draft Brampton candidate records and enrichment fields, but AI output must remain draft-only until reviewed.

Draft workflow:

1. Discover candidate services into `data/drafts/brampton-on/<category>/`.
2. Validate basic schema and source URLs.
3. Human reviewer checks official source, service area, contact path, and category.
4. Approved records enter `data/services.json` or the DB import pipeline as L1.
5. Embeddings are regenerated after data changes.

AI must not invent phone numbers, addresses, hours, eligibility, identity tags, land acknowledgments, or partner relationships.

### 6.4 Brampton Source Priorities

The implementation plan should prioritize authoritative and direct sources:

1. provider official websites,
2. municipal/regional pages for public services,
3. official Ontario or Canada pages,
4. 211 Ontario as a reference source for discovery and cross-checking, not as an automatic publisher,
5. community organization pages when direct provider information is unavailable.

## 7. User Experience

### 7.1 Homepage

The homepage should keep the current region-led identity pattern but make it city-aware. Instead of removing
"Kingston CareConnect", the hero should render an animated supported-region prefix before the stable CareConnect brand.

Recommended first-viewport behavior:

1. brand remains CareConnect,
2. the hero headline cycles through supported region labels such as "Kingston CareConnect" and "Brampton CareConnect",
3. the selected/active place is still visible near the search box and is not hidden behind the animation,
4. users can change place without opening settings,
5. search examples and stats adapt to the selected place,
6. Brampton preview state can say that coverage is starting with core services.

Hero animation requirements:

1. The rotating word or phrase must be driven by the place registry, not a separate hard-coded list.
2. The animation should include only supported live or preview places, not future hidden regions.
3. The stable accessible heading should remain clear to screen readers, for example "CareConnect for supported Ontario communities".
4. The visual animation must respect `prefers-reduced-motion`; reduced-motion users should see a static selected-place or default-supported-place heading.
5. The animation must not cause layout shift when labels differ in length.
6. The animation must not replace the explicit selected-place control; it is brand/positioning, not the user's search filter state.

### 7.2 Service Cards

Cards should show place/coverage clearly:

1. local city badge for Brampton or Kingston when useful,
2. regional badge for Peel-region style services when introduced,
3. Ontario-wide and Canada-wide badges retained,
4. distance shown only when coordinates and user location make sense,
5. service-area text shown where it prevents confusion.

### 7.3 Empty And Sparse Results

Brampton will start sparse. Empty states must be honest:

1. "No Brampton records match this search yet" is acceptable.
2. Offer Ontario-wide/Canada-wide resources where relevant.
3. Offer a "suggest a service" path.
4. Do not silently show Kingston-only results under a Brampton context.

### 7.4 Accessibility

The city selector must:

1. expose the active city via accessible name or visible text,
2. support keyboard navigation,
3. not depend on hover,
4. work with screen readers,
5. handle geolocation denied/error states,
6. preserve focus when a place is selected.

## 8. Public Positioning And Documentation

The public narrative should become:

> CareConnect is a privacy-first, city-aware access layer for local social services, starting with Kingston and expanding carefully to Brampton.

Required copy changes:

1. README mission and dataset description.
2. homepage hero, rotating supported-region headline, and stats.
3. page metadata in `app/[locale]/layout.tsx`.
4. About page title, subtitle, and governance language.
5. Partners/source page reference organizations and descriptions.
6. FAQ and user guide references to Kingston-only scope.
7. Press kit and launch materials.
8. Governance docs currently named around "Kingston 150".
9. AI assistant system prompt copy that currently names Kingston only.
10. Search empty-state copy such as "No local Kingston services..."

Project naming:

1. Keep the product name **CareConnect**.
2. Do not rename to Brampton CareConnect.
3. Keep region-led homepage expressions such as "Kingston CareConnect" and "Brampton CareConnect" as dynamic display copy.
4. Use city context in UI copy: "CareConnect for Brampton" or "Showing services for Brampton" where needed.

Land acknowledgment:

1. Do not reuse Kingston/Katarokwi acknowledgment for Brampton.
2. Before publishing Brampton-specific acknowledgment text, verify wording through reliable local or Indigenous-led public sources.
3. If verified wording is not ready at Brampton launch, show a broader respect statement and link to a pending governance note rather than publishing unverified local specificity.

Partner/source positioning:

1. Existing Kingston reference organizations should remain visible only in Kingston context or as historical/source references.
2. Brampton/Peel reference organizations should be added only when used as actual curation sources.
3. Reference sources must not be framed as official partnerships unless confirmed.

## 9. Data And Runtime Changes

### 9.1 TypeScript And Zod

Update:

1. `types/service.ts`
2. `types/service-public.ts`
3. `lib/schemas/service.ts`
4. `lib/schemas/service-create.ts`
5. CSV/import schemas if they expose `scope`
6. search request schema

Add:

1. place registry types,
2. coverage validation,
3. migration helpers from legacy `scope` to coverage,
4. compatibility utilities for badges and filtering.

### 9.2 Supabase

Add migration support for coverage fields without breaking current runtime reads.

Practical first migration:

1. add `primary_place_id TEXT`,
2. add `coverage JSONB`,
3. backfill coverage from existing `scope`,
4. update `services_public` to expose safe coverage/place fields,
5. keep `scope` during the transition,
6. add lightweight indexes only after query patterns justify them.

Before any production migration or backfill, run a read-only live-schema preflight against the target environment and compare expected columns/views.

### 9.3 Local JSON And Embeddings

`data/services.json` should carry the new fields for existing Kingston and provincial/national services. After adding Brampton services, run:

1. schema validation,
2. data audits,
3. embedding regeneration,
4. targeted search QA.

No generated or draft Brampton service should be committed as visible service data without L1 review.

### 9.4 Offline And Export

The offline export endpoint should include public coverage/place fields. IndexedDB can store the enriched `Service` shape without a DB version bump if object stores remain unchanged, but the implementation should verify stale cached services do not keep an old shape indefinitely.

Search should work offline with the selected place stored locally.

## 10. Rollout Plan

### Phase 1: Foundation

1. Add place registry.
2. Add coverage types and compatibility helpers.
3. Backfill in-memory behavior from legacy `scope`.
4. Add search filtering by selected place.
5. Add tests for Kingston, Brampton, provincial, and national coverage.

### Phase 2: UI Selection

1. Add city selector near search controls.
2. Add browser geolocation inference with explicit permission.
3. Store manual city selection locally.
4. Update empty states and badges.
5. Run accessibility checks for selector and result states.

### Phase 3: Data Contract

1. Add DB migration for `primary_place_id` and `coverage`.
2. Update `services_public`.
3. Update service mapping/import code.
4. Update offline export.
5. Verify local JSON and server mode parity.

### Phase 4: Public Positioning

1. Replace Kingston-only product copy with city-aware copy while keeping the animated supported-region hero pattern.
2. Update About, partners, FAQ, user guide, metadata, and launch materials.
3. Rename or revise "Kingston 150" governance language to a place-neutral standard.
4. Update i18n messages across all supported locales.

### Phase 5: Brampton Drafts And Review

1. Create Brampton draft discovery prompts and directories.
2. Build small candidate set.
3. Review to L1.
4. Add approved records.
5. Regenerate embeddings.
6. Run Brampton search QA.

### Phase 6: Brampton Preview/Launch

1. Enable Brampton in place registry as `preview`.
2. Verify core search flows and sparse-result states.
3. Publish as `live` when the minimum dataset and copy are ready.
4. Monitor user feedback and data reports without logging query text.

## 11. Testing And Verification

Required automated checks:

1. Unit tests for coverage matching.
2. Unit tests for selected-place fallback.
3. Unit tests for scope-to-coverage compatibility.
4. Search tests showing Kingston-only services do not appear in Brampton context.
5. Search tests showing Ontario-wide and Canada-wide services appear in both cities.
6. Server search schema tests for `placeId`.
7. Offline export shape tests.
8. Service card badge tests.
9. City selector accessibility tests.
10. Hero rotating-region tests, including stable layout and reduced-motion behavior.
11. i18n audit after copy changes.

Required manual checks:

1. Keyboard city selection.
2. Screen-reader labels for active place.
3. Geolocation denied state.
4. Brampton sparse search paths.
5. Crisis search behavior in both cities.
6. Service-detail pages for local, regional, provincial, and national records.
7. Hero animation cycles through supported regions without hiding the selected-place control.
8. Hero reduced-motion behavior is static and readable.

## 12. Risks And Controls

| Risk                                   | Control                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Bad Brampton data due to AI drafting   | AI output remains draft-only; L1 checks required before visibility        |
| Duplicated services across cities      | Canonical service identity plus coverage areas                            |
| Confusing city inference               | Visible selected-place control and manual override                        |
| Hero animation implies selected city   | Animation stays separate from explicit selected-place control             |
| Hero animation harms accessibility     | Reduced-motion fallback, stable heading semantics, and layout-shift tests |
| Privacy regression                     | No IP inference, local selected-place storage, no query logging           |
| Kingston regressions                   | Compatibility mapping from current `scope` and tests for Kingston context |
| Sparse Brampton results feel broken    | Honest empty states and broad-resource fallback                           |
| Incorrect Brampton land acknowledgment | Publish only verified wording; otherwise use broader respectful copy      |
| Server/local divergence                | Shared coverage helpers used by local and server search                   |

## 13. Implementation Acceptance Criteria

The multi-city foundation is ready when:

1. Kingston search behavior remains equivalent for existing users.
2. Brampton can be selected manually.
3. Browser geolocation can suggest a supported place only after user permission.
4. Brampton searches include Brampton, regional, Ontario-wide, and Canada-wide services while excluding Kingston-only services.
5. Existing provincial and national services continue to appear where appropriate.
6. Homepage hero cycles through supported region labels from the place registry while preserving a stable CareConnect brand.
7. The hero respects reduced-motion preferences and does not obscure the selected-place control.
8. Public copy no longer implies the whole product is Kingston-only.
9. Brampton records are visible only after L1 review.
10. Offline search respects the selected place.
11. Server search and local search use the same coverage semantics.
12. Accessibility, type-checking, linting, data validation, and targeted tests pass.
