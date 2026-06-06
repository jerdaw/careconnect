---
status: stable
last_updated: 2026-06-05
owner: jer
tags: [architecture, documentation, operations, privacy, public-docs]
---

# ADR-022: Maintain A Public Documentation Boundary

## Context and Problem Statement

CareConnect is moving toward a cleaner public GitHub footprint while still needing accurate operational knowledge for maintainers.

The repository previously mixed public project documentation with environment-specific deployment facts, alert routing examples, private host-path references, and historical planning material that was no longer appropriate for the public project surface. That created avoidable disclosure risk and made it harder to tell which docs were canonical for public contributors.

## Decision Drivers

- Keep public docs useful for development, architecture review, and governance review.
- Avoid publishing deployment coordinates, private operations notes, provider routing details, or maintainer-only runtime procedures in prose docs.
- Preserve only schema-shape examples and stale-link tombstones in public platform-contract files.
- Preserve private maintainer context in the private/shared operations source of truth without committing plaintext private notes to this public repo.
- Keep authorship and contributor references human-owned, with no AI tool attribution in docs, commits, or release material.
- Keep service-data integrity rules intact: AI-assisted material may inform drafts or enrichment workflows, but public service information requires manual curation and verification.

## Considered Options

1. Keep all historical docs public and rely on readers to distinguish current material.
   - Rejected: stale or private operational details are too easy to misread or disclose.
2. Delete sensitive or obsolete material without preserving maintainer context.
   - Rejected: maintainers still need a private record for safe operations and future review.
3. Split public-safe docs from private/shared operations material, with ignored
   local private folders retained only as optional convenience copies.
   - Chosen.

## Decision Outcome

CareConnect public documentation now follows this boundary:

1. Public docs describe architecture, local development, high-level release principles, privacy posture, testing posture, and governance process.
2. Public boundary entrypoints may state that shared-host documentation ownership and production deployment details are maintained outside this public repository.
3. Exact production host paths, live bind details, alert routing, credentials, private deployment procedures, and maintainer-only operational runbooks stay out of public prose docs.
4. The repo-root `platform-ops-contract.example.yaml` file and legacy-path `platform-ops-contract.yaml` tombstone preserve schema shape only and must use fake/example values.
5. Durable private plaintext notes belong in the private/shared operations
   source of truth; ignored private paths may remain local convenience copies
   only.
6. Public release and deployment scripts must use explicit environment variables for environment-specific runtime facts instead of hardcoded private paths.
7. `AGENTS.md` remains the canonical contributor instruction file, with `CLAUDE.md` and `GEMINI.md` kept as relative symlinks for compatibility.
8. Docs, changelogs, release notes, and commits must list only real human contributors or permitted automation accounts as authors/contributors.

## Consequences

### Positive

- The public repository is safer to publish and easier for contributors to understand.
- Private operational facts can continue to exist without becoming accidental public documentation.
- Tests can assert the documentation boundary without encoding private path literals.

### Negative / Tradeoffs

- Some public runbooks are intentionally high level and require private/shared operations material for live operations.
- Maintainers must keep public summaries and private operational records synchronized when deployment contracts change.
- Historical AI-result archives remain distinguishable as governed audit artifacts, not author/contributor attribution or automatically trusted service data.

## Implementation Notes

- Public docs were rewritten to remove private deployment coordinates, alert routing examples, and over-specific operational paths.
- Private originals were migrated to the private/shared operations source of
  truth, while ignored local copies were preserved for convenience.
- `.gitignore` now blocks plaintext private notes under `private/`.
- A sanitized `platform-ops-contract.yaml` tombstone remains at the legacy path so stale branch-based raw/CDN requests receive harmless example content.
- Documentation hygiene tests now assert the public boundary while allowing only example platform-contract values in public Git.

## Related Decisions

- [ADR-015: Non-Blocking E2E Tests](015-non-blocking-e2e-tests.md)
- [ADR-019: Production Observability And Alerting](019-production-observability-and-alerting.md)
- [ADR-021: Use A Dedicated Supabase DB Integration Test Lane](021-dedicated-supabase-db-integration-tests.md)

## Links

- `docs/governance/documentation-guidelines.md`
- `docs/development/roadmap-process.md`
- `docs/development/testing-guidelines.md`
- `docs/planning/archive/2026-06-04-public-github-cleanup.md`
