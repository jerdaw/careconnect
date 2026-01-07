# ADR 003: Librarian Model for Public Search

## Status

Accepted (Implemented in v13.0)

## Date

2026-01-07 (Updated from 2026-01-04)

## Context

Kingston Care Connect currently supports client-side search using a bundled JSON dataset and/or broad Supabase reads.
This architecture makes it difficult to:

- prevent accidental leakage of future internal-only fields (draft services, reviewer notes, partner-only metadata),
- scale beyond the current dataset without increasing client payload size,
- maintain a clear, enforceable public/private boundary as the Partner Portal grows.

The roadmap (v13.0) calls for “Privacy-First Data Fetching” via a server-side “Librarian Model”.

## Decision

We will implement a **Librarian Model** for public search:

- Public search and service detail fetches go through **server-controlled API endpoints**.
- Supabase data is exposed to the public app only via an explicit **public projection** (`services_public`) rather than direct reads from the internal `services` table.
- Search requests carrying user-entered text use `POST` (JSON body) to avoid query strings and reduce privacy risk.
- Personalization and geolocation boosting remain client-side by default.

## Consequences

- **Positive:** Creates a strict boundary that enables future internal notes and draft workflows safely.
- **Positive:** Reduces default client payload size and improves scalability.
- **Positive:** Supports incremental rollout via feature flags and dual-path fallback.
- **Neutral:** Public search becomes a network dependency; offline behavior must be explicitly designed and communicated.
- **Risk:** Privacy posture changes (search text may transit the server). Mitigations include POST-only, no query logging, and no tracking.
