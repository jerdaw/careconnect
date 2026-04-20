```
---
status: stable
last_updated: 2026-04-18
owner: jer
tags: [search, ranking, performance]
---

# ADR 004: Hybrid Search Ranking & Multipliers (v16.0)

## Status

Accepted

## Context

CareConnect's server-side search (Librarian API) initially used basic database filters and simple ordering by verification status and freshness. As our data grew and our ranking requirements became more complex (including authority tiers, completeness boosts, and proximity decay), we needed a way to apply these factors consistently on the server.

The core challenge was that Supabase's PostgREST (via `supabase-js`) does not support complex scoring expressions or deep in-query mathematical boosts easily. Pure SQL implementations would be fragile, hard to maintain, and duplicate the TypeScript scoring logic already developed for client-side search.

## Decision

We implemented a **Hybrid Scoring Strategy** for the Search API (`/api/v1/search/services`):

1. **Candidate Retrieval (SQL)**: Fetch the full filtered candidate set from the `services_public` view using basic `ILIKE` filters and category matches for the current small curated dataset.
2. **In-Memory Scoring (TypeScript)**: The API route uses the same shared ranking pipeline as local search to apply:
   - **Authority Multipliers**: 1.25x for government, 1.15x for healthcare, etc.
   - **Freshness Multipliers**: Decaying boost for recently verified data.
   - **Verification Multipliers**: Boost for L3/L2 verified services.
   - **Completeness Boosts**: Additive points for services with phone, address, hours, etc.
   - **Intent Targeting Boosts**: Additive points for exact matches against `synthetic_queries`.
   - **Resource Capacity Boosts**: Additive points for large-scale organizations.
   - **Proximity Decay**: Multiplier based on distance: `1 / (1 + k * distance)`.
3. **Re-sorting & Pagination**: Sort by the final calculated score and apply `limit`/`offset` in memory before returning the response.

## Consequences

- **Positive**: Single source of truth for scoring logic in TypeScript. Code reuse between client and server modules. Rapid iteration on ranking factors without complex SQL migrations.
- **Positive**: Ability to handle non-geometric proximity (exempting virtual services from decay) easily.
- **Negative**: Full in-memory scoring remains acceptable only while the curated dataset stays small; if the dataset grows materially, DB-side ranking/index work will need a follow-on ADR.
- **Privacy**: No change to zero-knowledge guarantees; scoring happens in the ephemeral API execution context and is not logged.
```
