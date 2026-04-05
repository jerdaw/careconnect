---
status: stable
last_updated: 2026-04-04
owner: jer
tags: [implementation, v22.0, pilot, readiness, runbook]
---

# v22 Pilot Readiness Bundle

This folder is the scope-file-first handoff path for bounded `A6` verification/readiness work and `A16`
pilot-scope gap reporting.

Use with:

1. [v22.0 Phase 0 Implementation Plan](../v22-0-phase-0-implementation-plan.md)
2. [v22.0 Gate 0 Evidence Sync Runbook](../v22-0-gate-0-evidence-sync-runbook.md)
3. [v21.0 Admissions Portfolio Plan](../../planning/v21-admissions-portfolio-plan.md)

Rules:

1. This workflow does not change Gate 0 blocker status by itself.
2. Use a real pilot scope only. Do not fabricate scope entries or service gaps.
3. Do not edit `data/services.json` as part of this bundle without explicit approval.
4. Prefer dated output directories so readiness snapshots remain auditable.

## Inputs

Primary input:

1. [scope.template.json](scope.template.json)

Accepted JSON shapes:

1. A top-level array of scope entries
2. An object with a `services` array

Required fields per entry:

1. `service_id`
2. `sla_tier`

Optional fields per entry:

1. `pilot_cycle_id`
2. `org_id`

Allowed `sla_tier` values:

1. `crisis`
2. `high_demand`
3. `standard`

## Step 1: Create a Real Scope File

1. Copy [scope.template.json](scope.template.json) to a dated filename in this folder.
2. Replace placeholder service IDs with real pilot-scoped service IDs.
3. Keep only services that are actually in scope for the readiness pass.

Recommended filenames:

1. `YYYY-MM-DD-<pilot-cycle-id>-scope.json`
2. `YYYY-MM-DD-<pilot-cycle-id>-scope-org-<org-id>.json`

## Step 2: Run the Readiness Audit

Use a dated output directory inside this folder instead of writing into the root of the bundle.

Example:

```bash
npm run audit:pilot-readiness -- \
  --scope-file docs/implementation/v22-pilot-readiness/2026-04-04-v22-cycle-1-scope.json \
  --out-dir docs/implementation/v22-pilot-readiness/2026-04-04-v22-cycle-1
```

The command writes:

1. `pilot-readiness-audit.json`
2. `pilot-readiness-summary.md`
3. `pilot-verification-worksheet.csv`

## Step 3: Review and Prioritize

Treat the output as a ranked follow-through queue in this order:

1. verification freshness gaps (`missing`, `due`, `stale`)
2. missing structured hours and `hours_text`
3. missing `access_script`
4. missing required coordinates or address prerequisites
5. missing email
6. scope entries that do not match a local service record

Expected outputs:

1. A dated readiness snapshot for bounded `A6`
2. A pilot-scope fix list for bounded `A16`
3. A verification worksheet that can be used without mutating curated data

## Step 4: Keep the Workflow Non-Mutating

This bundle stops at reporting and prioritization unless a separate approval explicitly authorizes
curated service-data edits.

Allowed follow-through without further approval:

1. re-running the audit with a corrected scope file
2. generating a fresher dated output bundle
3. summarizing the findings in planning or handoff docs

Out of scope for this bundle:

1. editing `data/services.json`
2. changing Gate 0 blocker status
3. starting Phase 1 pilot feature work
