---
status: archived
last_updated: 2026-04-01
owner: jer
tags: [planning, v20.0, maintenance, workflows, governance, data]
---

# v20.0 Workflow Runtime Cleanup and 211 Sync Quarantine

## Summary

This archive records the completed April 1, 2026 maintenance wave that closed the remaining GitHub Actions runtime follow-up and quarantined the experimental 211 sync path while v22.0 Gate 0 remains the active strategic track.

This was bounded v20.0 maintenance work, not a new strategic version. The goal was to finish low-risk automation cleanup without distracting from the human-owned Gate 0 blockers.

## Completed Outcomes

1. Quarantined the 211 sync path:
   - removed scheduled execution from `Sync 211 Ontario Data`
   - required explicit manual workflow confirmation before any sync run can mutate `data/services.json`
   - required both `ALLOW_211_SYNC=1` and `API_211_KEY` for script execution
   - removed the mock-data fallback so missing credentials fail closed instead of generating placeholder records
   - removed the committed `211-mock-*` placeholder records from the authoritative service dataset
2. Closed the known GitHub Actions runtime follow-up:
   - upgraded `actions/setup-python` to `v6`
   - upgraded `actions/upload-artifact` to `v6` in the edited workflows
   - upgraded `dawidd6/action-download-artifact` to `v11`
   - replaced the archived `actions/create-release@v1` step with `gh release create`
3. Added focused verification:
   - added node-only unit coverage for the 211 sync quarantine guard and live-response mapping
   - revalidated documentation hygiene after updating roadmap and changelog references
4. Tightened local CI ergonomics:
   - updated `ci:check` to skip the DB lane when Docker is installed but the daemon is unavailable, matching the documented free-tier/local-dev behavior
5. Cleared a transitive dependency advisory:
   - pinned `@xmldom/xmldom` to `0.8.12` through `package.json` overrides to resolve the Capacitor CLI XML injection audit warning

## Verification Snapshot

Validated on 2026-04-01:

1. `npm run lint`
2. `npm run type-check`
3. `npm run check:refs`
4. `npm run validate-data`
5. `npm run test -- tests/unit/211-sync-quarantine.test.ts`
6. `npm run test -- tests/unit/documentation-hygiene.test.ts`
7. `actionlint .github/workflows/bundle-analysis.yml .github/workflows/ci.yml .github/workflows/circuit-breaker-integration.yml .github/workflows/deploy-docs.yml .github/workflows/health-check.yml .github/workflows/release.yml .github/workflows/sync-211.yml`

## Remaining Follow-Through

These items remain on the active roadmap because they are environment- or strategy-dependent, not because this maintenance batch is still open:

1. Run `npm run db:types` on a Docker-capable machine and type the remaining `notification_audit` path.
2. Keep the dedicated DB integration lane healthy and run `npm run test:db` locally when DB/auth changes need verification beyond hosted CI.
3. Continue the human-owned v22.0 Gate 0 closure work for `C1` legal review and `D4` partner-ops evidence.

## Canonical References

1. [Roadmap](../roadmap.md)
2. [Planning Index](../README.md)
3. [v20.0 Runtime Hardening and Performance Remediation](2026-03-30-v20-0-runtime-hardening-and-performance-remediation.md)
