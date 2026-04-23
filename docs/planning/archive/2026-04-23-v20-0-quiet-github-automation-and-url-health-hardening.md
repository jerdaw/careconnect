---
status: archived
last_updated: 2026-04-23
owner: jer
tags: [planning, v20.0, maintenance, workflows, governance, health-checks]
---

# v20.0 Quiet GitHub Automation and URL Health Hardening

## Summary

This archive records the completed April 23, 2026 maintenance wave that made GitHub governance automation quiet by default and hardened the monthly URL health workflow against routine CI false positives.

This was bounded maintenance work while v22.0 Gate 0 remains the active strategic track. The goal was to preserve governance evidence and operational visibility without generating avoidable inbox noise.

## Completed Outcomes

1. Reduced routine PR bot noise:
   - bundle analysis now prefers the Actions job summary and only maintains a sticky PR comment for actionable regressions or comparison failures
   - Dependabot manual-review gates now reuse one sticky comment instead of posting a fresh reminder on every synchronize event
2. Added reusable bot issue synchronization for scheduled governance workflows:
   - introduced a marker-based helper that finds the canonical bot-authored issue, updates or reopens it, closes duplicate open issues silently, and supports `close_when_resolved` plus `dry_run`
   - wired the helper into the monthly health check, monthly staleness check, monthly crisis verification reminder, and quarterly verification reminder workflows
3. Reconciled recurring governance issue lanes:
   - monthly and quarterly reminder lanes now keep one reusable issue with compact recent-cycle history
   - health and staleness lanes now keep at most one actionable finding issue and auto-close it when the condition clears
   - existing duplicate crisis reminder issues were reconciled during the first live run
4. Hardened the monthly URL health workflow:
   - added a bounded allowlist of official override probe targets for providers whose public pages intermittently block CI automation
   - kept the curated public service URLs unchanged while allowing the workflow to verify official service availability through a more stable provider-controlled endpoint
   - added a readable Actions job summary for broken and inconclusive results so routine healthy runs do not need extra PR or issue noise
5. Confirmed clean steady-state behavior:
   - the broken-URL finding issue closes automatically when the live report returns to `0` broken URLs
   - routine successful maintenance workflows now finish without creating new PR comments or duplicate reminder issues

## Verification Snapshot

Validated on 2026-04-23:

1. `npm run lint`
2. `npm run type-check`
3. `npx vitest run tests/lib/github/bot-issue-sync.test.ts`
4. `npx vitest run tests/lib/health/url-health-probes.test.ts`
5. `npx vitest run tests/unit/documentation-hygiene.test.ts`
6. Targeted Prettier checks on changed workflow, script, library, and documentation files
7. GitHub `workflow_dispatch` dry runs for the health, staleness, monthly crisis reminder, and quarterly reminder workflows
8. Live `main` reconciliation runs for the same four workflows
9. Live `main` monthly health check rerun after URL-health hardening, confirming `0` broken URLs and automatic closure/no-reopen behavior for the health issue lane

## Remaining Follow-Through

These items remain on the active roadmap because they are recurring maintenance, not because this batch is incomplete:

1. Monitor persistent monthly URL-health inconclusives and add official override probes only when a provider repeatedly blocks CI and a stable official provider endpoint exists.
2. Keep new GitHub automation additions aligned with the quiet-by-default pattern so routine success paths stay out of the inbox.
3. Continue the human-owned v22.0 Gate 0 closure work for `C1` legal review and `D4` partner-ops evidence.

## Canonical References

1. [Roadmap](../roadmap.md)
2. [Planning Index](../README.md)
3. [Architecture Overview](../../architecture.md)
4. [Bundle Size Tracking](../../development/bundle-size-tracking.md)
5. [Dependency Management](../../development/dependency-management.md)
