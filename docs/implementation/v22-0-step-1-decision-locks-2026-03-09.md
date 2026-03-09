---
status: stable
last_updated: 2026-03-09
owner: jer
tags: [implementation, v22.0, governance, approvals, gate-0]
---

# v22.0 Step 1 Decision Locks (2026-03-09)

This memo captures the Step 1 lock rationale for D1-D7.

Related:

1. [v22.0 Approval Checklist](../planning/v22-0-approval-checklist.md)
2. [v22.0 Non-Duplicate Value Decision Plan](../planning/v22-0-non-duplicate-value-decision-plan.md)
3. [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md)

## Decision Lock Summary

| Decision ID | Locked Choice                                | Rationale                                                                    |
| ----------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| D1          | Connection outcomes over directory breadth   | Aligns directly with v22 objective function and gate metrics.                |
| D2          | Hard constraints unchanged                   | Preserves privacy-first architecture and anti-duplication scope controls.    |
| D3          | Housing intake pilot domain                  | Narrow, high-friction domain appropriate for measurable connection outcomes. |
| D4          | 5-10 providers, 2-3 frontline orgs           | Balanced pilot scale for signal quality without operational overload.        |
| D5          | Keep thresholds/kill rules as written        | Prevents threshold drift and post-hoc metric interpretation.                 |
| D6          | Keep API redlines exactly as written         | Maintains no-query-text and no forced identity telemetry boundaries.         |
| D7          | Narrow scope first, then deprecate if needed | Pre-commits to responsible fallback path if integration constraints fail.    |

## Scope Notes

1. Integration feasibility is in `conditional` mode pending completion of C1/C2 controls.
2. No pilot integration activation is permitted before conditional controls are complete.
3. Baseline metrics are operating in Gate 0 minimum mode until missing metric dependencies are instrumented.

## Sign-Off

- Owner: `jer`
- Date: `2026-03-09`
