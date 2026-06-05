---
status: stable
last_updated: 2026-06-04
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
- Preserve exact live runtime fields only in the repo-root `platform-ops-contract.yaml` manifest required by shared CI checks.
- Preserve private maintainer context without committing plaintext private notes.
- Keep authorship and contributor references human-owned, with no AI tool attribution in docs, commits, or release material.
- Keep service-data integrity rules intact: AI-assisted material may inform drafts or enrichment workflows, but public service information requires manual curation and verification.

## Considered Options

1. Keep all historical docs public and rely on readers to distinguish current material.
   - Rejected: stale or private operational details are too easy to misread or disclose.
2. Delete sensitive or obsolete material without preserving maintainer context.
   - Rejected: maintainers still need a private record for safe operations and future review.
3. Split public-safe docs from ignored private maintainer material.
   - Chosen.

## Decision Outcome

CareConnect public documentation now follows this boundary:

1. Public docs describe architecture, local development, high-level release principles, privacy posture, testing posture, and governance process.
2. Public boundary entrypoints may reference the canonical shared documentation boundary at `/home/jer/repos/vps/platform-ops/docs/standards/PLAT-009-shared-vps-documentation-boundary.md`.
3. Exact production host paths, live bind details, alert routing, credentials, private deployment procedures, and maintainer-only operational runbooks stay out of public prose docs.
4. The repo-root `platform-ops-contract.yaml` file is the controlled exception: it mirrors live platform-ops inventory fields so shared CI can detect drift.
5. Private plaintext notes belong under ignored private paths, or in a separately governed private operations repository.
6. Public release and deployment scripts must use explicit environment variables for environment-specific runtime facts instead of hardcoded private paths.
7. `AGENTS.md` remains the canonical contributor instruction file, with `CLAUDE.md` and `GEMINI.md` kept as relative symlinks for compatibility.
8. Docs, changelogs, release notes, and commits must list only real human contributors or permitted automation accounts as authors/contributors.

## Consequences

### Positive

- The public repository is safer to publish and easier for contributors to understand.
- Private operational facts can continue to exist without becoming accidental public documentation.
- Tests can assert the documentation boundary without encoding private path literals.

### Negative / Tradeoffs

- Some public runbooks are intentionally high level and require private maintainer material for live operations.
- Maintainers must keep public summaries, private operational records, and the root runtime contract synchronized when deployment contracts change.
- Historical AI-result archives remain distinguishable as governed audit artifacts, not author/contributor attribution or automatically trusted service data.

## Implementation Notes

- Public docs were rewritten to remove private deployment coordinates, alert routing examples, and over-specific operational paths.
- Private originals were preserved under ignored private maintainer paths.
- `.gitignore` now blocks plaintext private notes under `private/`.
- Documentation hygiene tests now assert the public prose boundary while allowing the root runtime contract required by shared CI.

## Related Decisions

- [ADR-015: Non-Blocking E2E Tests](015-non-blocking-e2e-tests.md)
- [ADR-019: Production Observability And Alerting](019-production-observability-and-alerting.md)
- [ADR-021: Use A Dedicated Supabase DB Integration Test Lane](021-dedicated-supabase-db-integration-tests.md)

## Links

- `docs/governance/documentation-guidelines.md`
- `docs/development/roadmap-process.md`
- `docs/development/testing-guidelines.md`
- `docs/planning/archive/2026-06-04-public-github-cleanup.md`
