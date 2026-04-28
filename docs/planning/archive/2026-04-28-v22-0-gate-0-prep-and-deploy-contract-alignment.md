---
status: archived
last_updated: 2026-04-28
owner: jer
tags: [planning, v22.0, maintenance, gate-0, deployment]
---

# v22.0 Gate 0 Prep and Deploy Contract Alignment

## Summary

This archive records the completed 2026-04-28 autonomous maintenance pass for
CareConnect while v22.0 Gate 0 remains blocked on external evidence.

The work prepared the next C1 and D4 evidence intake packets, corrected stale
Gate 0 tracker wording, aligned active deploy documentation with the shared
`platform-ops` frontend env-file contract, and verified the repo under the
supported Node runtime.

## Completed Outcomes

1. Prepared C1 legal/API evidence intake scaffolding:
   - [C1-20260428-submission.md](../../implementation/v22-0-evidence/c1-partner-terms/C1-20260428-submission.md)
   - [C1-20260428-clause-matrix.md](../../implementation/v22-0-evidence/c1-partner-terms/C1-20260428-clause-matrix.md)
   - [C1-20260428-artifact-inventory.md](../../implementation/v22-0-evidence/c1-partner-terms/C1-20260428-artifact-inventory.md)
2. Prepared D4 partner-ops evidence intake scaffolding:
   - [D4-20260428-submission.md](../../implementation/v22-0-evidence/d4-partner-ops/D4-20260428-submission.md)
   - [D4-20260428-partner-list.md](../../implementation/v22-0-evidence/d4-partner-ops/D4-20260428-partner-list.md)
   - [D4-20260428-outreach-log.csv](../../implementation/v22-0-evidence/d4-partner-ops/D4-20260428-outreach-log.csv)
   - [D4-20260428-artifact-inventory.md](../../implementation/v22-0-evidence/d4-partner-ops/D4-20260428-artifact-inventory.md)
3. Marked all new evidence intake files as `prep_only` so they cannot be
   mistaken for legal review, partner commitment, or outreach execution
   evidence.
4. Synchronized Gate 0 tracker wording:
   - C2 is consistently recorded as complete.
   - C1 and D4 remain pending.
   - Gate 0 remains `NO-GO` with blockers `G0-3` and `G0-8`.
5. Aligned CareConnect deploy and rollback docs with `platform-ops`:
   - `/etc/projects-merge/env` remains root-only.
   - the reliable frontend deploy path remains
     `sudo ./scripts/deploy-vps-proof.sh /etc/projects-merge/env/careconnect-web.env`.
   - `release-vps-proof.sh` is documented as the staging helper for the current
     production path.
6. Added documentation-hygiene coverage for the evidence and deploy-contract
   invariants.
7. Regenerated embeddings through the supported build/postbuild path; the
   generator updated one tracked embedding vector deterministically.

## Verification Snapshot

Validated on 2026-04-28 with Node v24.12.0:

1. `npm run ci:check`
2. `npm run check:v22-gate0` returned the expected `NO-GO` block on `G0-3` and
   `G0-8`
3. `/home/jer/repos/vps/platform-ops/scripts/checks/check-shared-doc-boundary.py --repos-root /home/jer/repos/vps --checkout careconnect`
4. `/home/jer/repos/vps/platform-ops/scripts/checks/check-runtime-contract-sync.py --repos-root /home/jer/repos/vps --checkout careconnect --require-manifests`

Local DB integration tests were skipped by `npm run ci:check` because Docker
and/or `psql` were unavailable. Playwright stayed deferred per the free-tier CI
testing posture.

## Remaining Follow-Through

This maintenance pass does not close Gate 0. The remaining blockers are:

1. `UA-1 / G0-3`: attach candidate partner legal/API terms and complete
   clause-level C1 review.
2. `UA-3 / G0-8`: attach named pilot partner list, outreach owner assignment,
   and dated outreach execution evidence.

## Canonical References

1. [Roadmap](../roadmap.md)
2. [Planning index](../README.md)
3. [v22.0 Gate 0 User Action Tracker](../../implementation/v22-0-gate-0-user-action-tracker.md)
4. [v22.0 Gate 0 Exit Checklist](../../implementation/v22-0-gate-0-exit-checklist.md)
5. [Production Deployment Checklist](../../deployment/production-checklist.md)
