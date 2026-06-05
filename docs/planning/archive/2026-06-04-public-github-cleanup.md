---
status: archived
last_updated: 2026-06-04
owner: jer
tags: [planning, archive, public-docs, maintenance, governance]
---

# Public GitHub Cleanup Archive

## Status

Complete as of 2026-06-04.

## Scope

This maintenance pass prepared the repository for a safer public GitHub footprint without changing service data, search behavior, authentication, schema contracts, or runtime business logic.

Completed work:

1. Replaced public deployment and operations docs with public-safe summaries.
2. Removed exact deployment commands, private host-path examples, alert-routing examples, and maintainer-only runtime procedures from public prose docs.
3. Kept `platform-ops-contract.yaml` as the controlled runtime-contract exception that mirrors platform-ops live inventory for shared CI drift checks.
4. Preserved private originals under ignored private maintainer paths.
5. Replaced the admissions-focused v21 planning track with a public-interest external-validation backlog.
6. Softened legal, privacy, accessibility, and compliance wording to avoid unsupported formal-compliance claims.
7. Kept `AGENTS.md` as the canonical contributor instruction file and verified `CLAUDE.md` and `GEMINI.md` are relative symlinks.
8. Updated tests and scripts so public docs and release helpers rely on boundary-safe contracts.
9. Added ADR-022 to make the public documentation boundary explicit.

## Verification

Completed local checks:

1. Focused public-boundary scans for private deployment coordinates, live host-path patterns, alert-routing examples, and removed admissions-plan wording.
2. Focused AI-authorship scan for contributor/author attribution patterns.
3. WSL Git status review to avoid staging Windows symlink and line-ending noise.
4. `bash -n` for updated release helper scripts.
5. `npm run type-check`.
6. `npm run i18n-audit`.
7. `npm run format:check`.
8. `npm run lint`.
9. `npm run check:refs`.
10. `npm run check:root`.
11. `npm test -- --run`.
12. Targeted docs, alerting, and Slack integration Vitest files.
13. Shared platform-ops documentation-boundary and runtime-contract sync checks.
14. `git diff --check`.

Validation limitations:

1. Playwright was intentionally not run locally under the current free-tier CI posture.

## Remaining Roadmap Items

No new product roadmap item was created by this cleanup.

The normal active follow-ups remain:

1. Close v22 Gate 0 C1 legal/API evidence.
2. Close v22 Gate 0 D4 partner-operations evidence.
3. Keep authenticated dashboard/admin visual QA tracked until a valid local Supabase environment and signed-in sessions are available.
4. Resolve dependency-audit findings through bounded maintenance.

## References

- [ADR-022: Maintain A Public Documentation Boundary](../../adr/022-public-documentation-boundary.md)
- [Roadmap](../roadmap.md)
- [Documentation Guidelines](../../governance/documentation-guidelines.md)
- [Roadmap Process](../../development/roadmap-process.md)
