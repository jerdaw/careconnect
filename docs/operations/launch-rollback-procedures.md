# Public Rollback Boundary

**Last Updated:** 2026-06-04

CareConnect maintainers should have a tested rollback procedure before any live release. Exact rollback commands, release roots, host paths, credentials, and access procedures are intentionally excluded from public documentation.

## Public Rollback Principles

1. Preserve user safety and access to verified crisis resources.
2. Prefer the last known good release when a new release creates critical degradation.
3. Avoid database writes during incident pressure unless a read-only preflight confirms the target schema and a rollback plan exists.
4. Re-run health, search, and data-integrity checks after rollback.
5. Document the incident privately, then publish only public-safe summaries if needed.

## Public Triggers

- public search unavailable,
- critical service-detail rendering failure,
- security or privacy risk,
- severe data-integrity regression,
- failed health checks after a release.
