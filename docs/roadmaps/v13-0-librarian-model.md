# v13.0: Privacy-First Data Fetching ("Librarian Model")

> **Status**: ✅ Completed (2026-01-07)
> **Roadmap Version**: v13.0 (Secure Data Architecture)
> **Last Updated**: 2026-01-07
> **Owner/Resourcing**: Solo dev + AI assistance (free-tier friendly)
> **Scope Guardrail**: No IRL work (no outreach, no manual data expansion, no partnerships required)

This document is the **version definition / implementation plan** for v13.0’s **Librarian Model**:
move public search and service fetching to a server-controlled interface so we **stop shipping the full dataset** (and future internal metadata) to the client by default.

---

## 0) Executive Summary (What we’re building)

### The problem (today)

Right now, the public app can load **all services** into the browser (from `data/services.json` and/or by `select("*")` from Supabase). This has 3 strategic issues:

1. **Security / governance**: We cannot safely add internal-only fields (draft services, reviewer notes, partner-only metadata, verification workflow state) if the client receives the whole record set.
2. **Scalability**: “Send everything to the client” becomes brittle as we go beyond the Kingston 150/169.
3. **Privacy posture drift**: If the dataset grows or includes sensitive operational notes, it becomes too easy to leak information unintentionally.

### The solution (v13.0)

Introduce a **server-side “Librarian” layer** that:

- Serves **public** service data via **server-controlled API** (Next.js route handlers backed by Supabase).
- Returns **only what the UI needs** (search results + on-demand details), not the full dataset.
- Keeps **privacy-first guarantees** by:
  - not logging search queries,
  - avoiding query strings for sensitive search text,
  - keeping personalization and location calculations client-side whenever possible.

### What stays the same

- **Manual curation** remains the source of truth for “Top services” (no new scraping).
- **No tracking / no cookies** for public search.
- **Client-side AI Assistant remains local-only** (queries never leave the device).
- Existing UI/UX can remain familiar; this is primarily a **data access architecture** change.

---

## 1) Goals / Non-Goals

### Goals (must-have)

1. **Stop bundling and sending the full service dataset to the client by default.**
2. **Define a public/private data boundary** that can safely support internal notes and drafts later.
3. **Keep search fast and helpful** with comparable relevance to the current client-side engine.
4. **Keep privacy-first stance**:
   - do not store queries,
   - do not introduce user tracking,
   - keep user context (identity boosting) and location logic local.
5. **Maintain offline resilience** (at minimum: cached last results + offline service pages for previously visited services).
6. **Maintain full `next-intl` compliance** for any new UI strings.

### Non-goals (explicitly out of scope for this cycle)

- Ontario-wide expansion or new service research/verification (v11.0 IRL-heavy).
- 211 partnership activation (we can design for it, but not execute or depend on it).
- New data model fields that require IRL verification processes (we’ll design boundaries, not expand the dataset).
- A full “PostgreSQL-first rewrite” of the product; v13 is an architectural change, not a re-platforming.
- Any feature that introduces persistent identifiers or tracking for public users.

---

## 2) Current State Snapshot (v12.0 baseline)

### Data sources and flows (today)

- Public search uses `lib/search/*` which can load:
  - local JSON (`data/services.json` + `data/embeddings.json`), and/or
  - Supabase `services` table via a broad `select("*")`.
- Public REST endpoints exist:
  - `GET /api/v1/services` (supports `q` via query string; basic `ilike`)
  - `GET /api/v1/services/[id]`
- Search UI uses `hooks/useServices.ts` → `searchServices()` (client-side).
- Semantic embeddings are generated/build-time and can be shipped to the client.

### Why v13.0 now

The roadmap explicitly calls out the need to prevent “full database to client” because:

- we want **internal notes + drafts + verification metadata** that should never be public,
- we want **partner portal growth** without data leaks,
- we want to scale beyond the Kingston set without forcing a heavy initial payload.

---

## 3) Target Architecture (Librarian Model)

### Conceptual model

**Client (Patron)** asks **Server (Librarian)** for:

- a list of relevant “cards” (search results),
- and detailed info only when opening a service.

The Librarian:

- queries Supabase **through a public projection** (`services_public`), and/or
- calls a Supabase RPC function for ranked search,
- returns a **minimal, safe payload**.

### Data boundary: “Public Projection”

We introduce a strict boundary between:

- **Internal service record** (may include drafts, internal notes, moderation flags, partner-only fields).
- **Public service record** (what the public app can request).

Implementation mechanism:

- a dedicated **view** (preferred) or **table** (fallback) `services_public` containing only public-safe fields and only published rows.

### Privacy posture choices

To align with governance + crisis safety:

- **Search text should not travel in URLs** (avoid `?q=` for public search).
- Search requests use `POST` with JSON body.
- Server logs must be treated as sensitive:
  - do not log request bodies,
  - do not log search queries in structured logs,
  - keep rate limiting in-memory and ephemeral.

### Local-first where it matters

To keep privacy and UX strong:

- **Personalization** (identity boosting) stays client-side.
- **Geolocation** stays client-side (distance sorting and “near me” ranking computed locally when feasible).
- **Semantic re-ranking** should remain client-side when possible (see Embeddings Strategy).

---

## 4) Key Design Decisions (with rationale)

| Decision                |                                                       Recommended | Rationale                                               | Alternatives (why not)                                                  |
| ----------------------- | ----------------------------------------------------------------: | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Search query transport  |                                                  `POST` JSON body | Avoid URL logs and accidental caching of sensitive text | `GET ?q=` leaks via logs/caches/referrers                               |
| Public data access      |                                      `services_public` view + RLS | Simple boundary; PostgREST can expose view safely       | Column-level security is not real security                              |
| Search ranking location |                         Hybrid: server candidates + client boosts | Keeps location/user context local                       | Full server ranking requires sending sensitive signals                  |
| Semantic search         |                                      Client-side re-rank on top-K | Preserves “queries never leave device”                  | Server-side embedding or sending query embedding increases privacy risk |
| Offline behavior        | Cache last results + visited pages; optional “offline pack” later | Maintains resilience without shipping full dataset      | Full offline dataset by default conflicts with v13 goal                 |
| Rollout                 |                                 Feature flag + dual-path fallback | Safe migration; instant rollback                        | Big-bang switch risks regressions                                       |

---

## 5) Data Model Plan (Supabase)

### 5.1 Data classification (what is public?)

**Public-safe fields (examples):**

- Identity: `id`, `name`, `description`, `category/intent_category`
- Contact: `phone`, `email`, `url`, `address`
- Access: `hours` / `hours_text`, `languages`, `accessibility`, `coordinates`
- Governance: `verification_level`, `status`, `last_verified`, `provenance` (if we choose to show it)
- Safety: crisis flags/badges derived from category and copy

**Internal-only fields (future-ready):**

- `internal_notes`
- `verification_workflow_state` (triage status, reviewer, timestamps)
- `partner_draft_fields`
- `moderation_flags` / abuse reports
- raw ingestion traces from automation sources

This roadmap item does **not** require introducing internal-only fields now, but the boundary must assume they will exist.

### 5.2 Schema option A (preferred): view-based public projection

Create:

- `services` (internal canonical table, already exists)
- `services_public` (VIEW)

`services_public` includes only:

- public columns
- `WHERE published = true` (or `published_at IS NOT NULL`)

RLS:

- Allow `anon`/`authenticated` `SELECT` on `services_public`.
- Restrict direct `SELECT` on `services` to authenticated roles with explicit policies.

Notes:

- If we keep using PostgREST for reads, the view must live in a schema that Supabase exposes (typically `public`).

### 5.3 Schema option B (fallback): materialized public table

If view performance or tooling becomes problematic:

- `services_public` becomes a table populated by migration script.
- The app reads from `services_public`.
- The partner portal reads/writes to `services`.

This is more maintenance, but can be safer for strict separation.

### 5.4 Search indexing (minimal → advanced)

**Minimal (Phase 1):**

- B-tree indexes on `category`, `verification_status`, `published`
- Optional trigram index on `name`/`description` for `ilike` performance (pg_trgm)

**Advanced (Phase 2+):**

- Generated `tsvector` columns for `name`, `description`, plus FR variants
- Weighted ranking (name > tags > description)
- Optional synonyms table (governance-controlled, curated)

### 5.5 Embeddings strategy (privacy-first)

Target requirement: keep semantic capability without shipping the full embeddings dataset.

Recommended approach (phased):

1. **Phase 0–2**: Keep existing client-side semantic model, but only for:
   - AI Assistant (already opt-in), and
   - optional local re-ranking on small result sets.
2. **Phase 3**: Search API returns **optional per-result embeddings** (`includeEmbeddings: true`, capped to top-K).
   - Client can re-rank top-K results locally without sending query or embedding to server.
3. **Phase 4 (optional)**: Offer an explicit **Offline Pack** download:
   - public services snapshot + embeddings,
   - stored in Cache Storage / IndexedDB,
   - enables full offline search + assistant.

Hard rule: never return embeddings for “hidden” services, and never expose internal notes in embedding inputs.

---

## 6) API Contracts (Next.js Route Handlers)

### 6.1 New endpoint (recommended): `POST /api/v1/search/services`

Why a new endpoint:

- avoids breaking `GET /api/v1/services`
- makes privacy requirements explicit (POST-only, no query strings)

#### Request (JSON)

```jsonc
{
  "query": "string (optional, may be empty if filters present)",
  "locale": "en|fr|ar|zh-Hans|es (required)",
  "filters": {
    "category": "Food|Crisis|Housing|... (optional)",
    "verificationLevels": ["L0", "L1", "L2", "L3"] /* optional */,
    "includeProvincial": true /* optional, default true */,
    "openNow": false /* optional; ideally computed client-side */
  },
  "options": {
    "limit": 20,
    "offset": 0,
    "includeEmbeddings": false
  }
}
```

#### Response (JSON)

```jsonc
{
  "data": [
    {
      "id": "food-bank-project",
      "name": "string",
      "description": "string",
      "category": "Food",
      "verification_level": "L2",
      "address": "string|null",
      "phone": "string|null",
      "url": "string|null",
      "hours": { "monday": { "open": "09:00", "close": "17:00" } } /* optional */,
      "coordinates": { "lat": 44.23, "lng": -76.48 } /* optional */,
      "identity_tags": [{ "tag": "Youth", "evidence_url": "https://..." }],
      "embedding": [
        /* optional, only when requested */
      ]
    }
  ],
  "meta": {
    "total": 123,
    "limit": 20,
    "offset": 0,
    "mode": "server" /* or "fallback" during rollout */
  }
}
```

#### Privacy requirements (must enforce)

- Use `POST`.
- `Cache-Control: no-store` if `query` is non-empty (avoid caching sensitive text).
- Do not log `query` in server logs.
- Avoid returning internal columns even if the underlying table contains them.

#### Rate limiting

- Keep existing in-memory per-IP rate limit logic.
- Never store IPs in the database.
- If we need a more robust limiter later, prefer:
  - short-lived edge KV (if available), or
  - Supabase `pg_net` / DB table only with hashed IP + TTL (but this is a later consideration due to privacy).

### 6.2 Service detail endpoint

Keep existing:

- `GET /api/v1/services/[id]`

But update it (in implementation) to:

- read from `services_public` (not `services`)
- return only public-safe fields
- include provenance/trust fields only if they are explicitly intended for the public UI

---

## 7) UX & Product Behavior (expected changes)

### 7.1 Search UX

- Search remains “instant-feeling”:
  - optimistic loading state immediately,
  - debounced requests (current 150ms debounce remains reasonable),
  - results stream in quickly.
- Suggestion (“did you mean”) stays client-side initially (based on returned names/tags or a small local dictionary).

### 7.2 Offline behavior (minimum viable)

- If offline:
  - show cached last successful results (current behavior),
  - show cached service pages if previously visited,
  - show explicit offline page (`/offline`) otherwise.

Optional later:

- Add a user-controlled “Make available offline” option (Offline Pack).

### 7.3 Privacy UX

If we ship server-side search, the privacy policy and in-app copy may require clarification.
This cycle’s deliverable is **technical architecture**, but the implementation must include:

- a short, clear UI line on Search explaining:
  - “We don’t store your searches”
  - “No tracking / no cookies”
  - and (if true) “Search requests are sent to the server to fetch results”

No dark patterns; make it plain.

---

## 8) Implementation Plan (Sequential Phases)

Each phase is written to be implementable as a series of small PRs, with rollback safety.

### Phase 0 — Baseline, Safety Rails, and Decision Lock

**Objective:** Establish measurement baselines and lock the minimal set of decisions so implementation doesn’t drift.

- [ ] Record baseline client payload sizes:
  - [ ] size impact of `data/services.json`
  - [ ] size impact of `data/embeddings.json`
  - [ ] current route-level JS bundles (Search + Service Detail)
- [ ] Baseline search performance (local):
  - [ ] median time-to-first-results
  - [ ] worst-case query time (long query, fuzzy, filters on)
- [ ] Baseline DB/API behavior:
  - [ ] confirm current `/api/v1/services` and `/api/v1/services/[id]` behavior
  - [ ] confirm current RLS posture for `services` table (what anon can see)
- [ ] Decide public projection approach (A view vs B table) and document rationale:
  - [ ] pick **A (view)** unless blocked
  - [ ] document fallback triggers (what would force B)
- [ ] Add/accept ADR (see `docs/adr/003-librarian-model-public-search.md`)

**Exit criteria:**

- We have written baselines in this doc (or a linked note).
- We have a clear “public vs internal” column list.
- ADR is accepted/proposed with explicit status.

### Phase 1 — Supabase Public Projection + RLS Hardening

**Objective:** Create a safe, enforceable data boundary. No UI changes yet.

**Deliverables:**

- `services_public` view or table
- RLS policies that ensure public reads only from the safe projection

**Tasks:**

- [ ] Add `published` or `published_at` to the canonical `services` record (if not already present).
- [ ] Create `services_public` with:
  - [ ] explicit column selection (no `SELECT *`)
  - [ ] explicit `WHERE published = true`
- [ ] RLS:
  - [ ] deny `anon` `SELECT` on `services`
  - [ ] allow `anon` `SELECT` on `services_public`
  - [ ] confirm partner portal paths still work
- [ ] Ensure `services_public` excludes:
  - [ ] internal notes (if they exist)
  - [ ] partner-only fields
  - [ ] embeddings by default
- [ ] Add indexes needed for Phase 2 query patterns.

**Validation checklist:**

- [ ] `anon` key cannot fetch from `services` directly (returns 401/empty as intended).
- [ ] `anon` key can fetch expected fields from `services_public`.
- [ ] Attempted access to internal-only columns fails.

### Phase 2 — Librarian Search API (Server)

**Objective:** Build the new POST search endpoint returning safe, minimal result payloads.

**Deliverables:**

- `POST /api/v1/search/services`
- input validation and error handling
- safe logging (no query string logs)

**Tasks:**

- [ ] Define Zod schema for request body:
  - [ ] locale enum
  - [ ] limits + offset bounds
  - [ ] filter enums (category, verification)
- [ ] Implement search query execution:
  - [ ] Phase 2a (minimal): `ilike` / `or` conditions against view columns
  - [ ] Phase 2b (improved): add `tsvector` search if available
  - [ ] Phase 2c (ranking): incorporate governance boosts (verification level, recency)
- [ ] Ensure response shape aligns with UI requirements:
  - [ ] include `identity_tags` and `coordinates` if needed for client-side boosts
  - [ ] include FR fields or locale-selected fields (decide which)
- [ ] Privacy headers:
  - [ ] `Cache-Control` tuned by presence of `query`
  - [ ] `Vary` where needed (locale)
- [ ] Rate limiting:
  - [ ] reuse existing per-IP limiter
  - [ ] avoid storing IPs or queries

**Exit criteria:**

- Endpoint returns correct results for:
  - [ ] empty query + category filter
  - [ ] non-empty query in EN and FR
  - [ ] limit/offset pagination
- Endpoint never logs query in `logger.*` calls.

### Phase 3 — UI Switch (Feature-Flagged)

**Objective:** Move the public UI from local `searchServices()` to the Librarian API without removing the fallback yet.

**Deliverables:**

- feature flag (env-driven) selecting search mode:
  - `server` (Librarian)
  - `local` (current behavior, as rollback)
- updated hooks to use API in server mode

**Tasks:**

- [ ] Add a `SearchMode` abstraction:
  - [ ] `useServices` chooses `serverSearch()` vs `searchServices()`
  - [ ] preserve progressive semantics flow (instant results, then optional enhancement)
- [ ] Keep personalization local:
  - [ ] do not send `userContext` to server
  - [ ] apply identity boosts after server results (client re-rank)
- [ ] Keep location local:
  - [ ] do not send coordinates to server (initially)
  - [ ] compute distances and open-now filtering client-side
- [ ] Update analytics payload:
  - [ ] remove raw query if policy requires (store only “zero-results” boolean + category)
  - [ ] confirm current analytics endpoint matches privacy policy
- [ ] Add UI copy (localized) if needed to clarify “no search storage”.

**Exit criteria:**

- Search works end-to-end in server mode.
- Local mode still works for rollback.
- No regressions in accessibility (keyboard, focus, screen readers).

### Phase 4 — Remove Default Full-Dataset Client Shipping

**Objective:** Achieve the core goal: the default public path does not ship the full dataset/embeddings.

This phase is where we remove/avoid:

- importing `data/services.json` in client bundles for default search
- importing `data/embeddings.json` in client bundles for default search

**Tasks:**

- [ ] Ensure server-mode search path does not reference JSON data in any client component.
- [ ] Split “offline/assistant pack” assets into on-demand fetches:
  - [ ] AI Assistant: keep opt-in download behavior
  - [ ] Semantic re-rank: only request embeddings for top-K results if enabled
- [ ] Add a bundle-size guardrail:
  - [ ] document expected size reduction
  - [ ] optionally add CI budget checks later (if feasible)

**Exit criteria:**

- Default Search page no longer includes full `services.json` and `embeddings.json` in its client bundle.
- Search still functions (server mode).
- Offline fallback still functions for cached paths.

### Phase 5 — Hardening: Relevance, Reliability, and Safety

**Objective:** Make the Librarian mode “production-grade” and at least as good as today.

**Tasks:**

- [ ] Relevance parity:
  - [ ] synonym expansion (governance-controlled list)
  - [ ] crisis intent boosts (server or client, but deterministic)
  - [ ] verified + recent boosts
- [ ] Abuse resistance:
  - [ ] ensure rate limit works under load
  - [ ] add request size limits
- [ ] Safety UI:
  - [ ] ensure crisis services always show 911/988 escalation affordance
  - [ ] ensure search for crisis language still surfaces crisis supports promptly
- [ ] Localization parity:
  - [ ] ensure FR search finds FR fields
  - [ ] ensure RTL locale doesn’t break result rendering

### Phase 6 — Tests, Verification, and Rollout

**Objective:** Ship safely with confidence and rollback.

**Testing plan:**

- [ ] Unit tests (Vitest):
  - [ ] request validation schemas
  - [ ] ranking/boosting pure functions
- [ ] Integration tests:
  - [ ] API endpoint returns safe fields only (no leakage)
- [ ] E2E tests (Playwright):
  - [ ] search flow in server mode
  - [ ] service detail fetch in server mode
  - [ ] offline fallback behavior

**Rollout plan:**

- [ ] Start with `SEARCH_MODE=server` in staging/local with Supabase.
- [ ] Keep `SEARCH_MODE=local` as instant rollback.
- [ ] After stability, switch default to server mode in prod.

**Archive plan:**

- [ ] When complete, move this doc to `docs/roadmaps/archive/` as `YYYY-MM-DD-v13-0-librarian-model.md`.
- [ ] Update `docs/roadmaps/roadmap.md` v13.0 status to “Completed”.
- [ ] Update `docs/architecture.md` to reflect what actually exists (no speculative sections).

---

## 9) Definition of Done (DoD)

v13.0 Librarian Model is considered “done” when:

- Public Search and Service Detail pages work in **server mode**.
- Default bundles do **not** include the full dataset/embeddings.
- Supabase enforces a **public/private boundary** (public projection + RLS).
- No endpoint logs search queries (and query strings are not used for user-entered search text).
- Accessibility and localization remain intact.
- A clear rollback path remains available (at least temporarily).

---

## 10) Risks & Mitigations

| Risk                                       |   Impact | Mitigation                                                                                        |
| ------------------------------------------ | -------: | ------------------------------------------------------------------------------------------------- |
| Server-side search changes privacy posture |     High | Use POST, no logs, no caches; keep personalization + location local; update policy/copy           |
| Relevance regression vs client search      |     High | Feature flag; incremental parity work; add E2E relevance sanity tests                             |
| Offline experience degrades                |   Medium | Cache last results + visited pages; optional offline pack later                                   |
| RLS misconfiguration leaks internal fields | Critical | Use `services_public` projection; deny direct `services` reads; add tests to assert field absence |
| Supabase quota/perf constraints            |   Medium | Minimal payloads, indexes, pagination, short TTL caching for non-sensitive requests               |

---

## 11) Open Questions (answer before Phase 2 ends)

1. Should public search return both EN and FR fields, or locale-selected fields only?
2. Do we want to expose `provenance` publicly on service details as a “trust panel” now, or defer to v14?
3. Are we comfortable keeping `/api/v1/services?q=` available for now, or should we deprecate it immediately for privacy reasons?
4. What is the minimum offline promise we want to make in the UI once server mode is default?
