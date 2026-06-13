---
status: stable
last_updated: 2026-06-12
owner: jer
tags: [implementation, v22.0, gate-0, evidence, runbook]
---

# v22.0 Gate 0 Evidence Sync Runbook

This runbook defines the exact repo update order after real `C1` or `D4` evidence is available.

Use with:

1. [v22.0 Gate 0 Evidence Intake Pack](v22-0-gate-0-evidence-intake-pack.md)
2. [v22.0 Gate 0 User Action Tracker](v22-0-gate-0-user-action-tracker.md)
3. [v22.0 Gate 0 Exit Checklist (Decision Control)](v22-0-gate-0-exit-checklist.md)
4. [v22.0 Gate 0 Evidence Workspace](v22-0-evidence/README.md)

Rules:

1. Do not mark any blocker `complete` unless the minimum evidence checks pass.
2. Evidence must be dated, attributable, and stored in the canonical evidence workspace.
3. Do not fabricate evidence, backfill dates, or infer closure from partial artifacts.
4. Re-run the gate check after every accepted evidence sync.

## Preconditions

1. A real evidence bundle has been added under [v22.0 Gate 0 Evidence Workspace](v22-0-evidence/README.md).
2. The applicable submission template has been filled:
   - `UA-1 / C1`: [C1 Submission Template](v22-0-evidence/c1-partner-terms/SUBMISSION_TEMPLATE.md)
   - `UA-3 / D4`: [D4 Submission Template](v22-0-evidence/d4-partner-ops/SUBMISSION_TEMPLATE.md)
3. The applicable intake-pack minimum checks have passed.

## Step 1: Validate the Evidence Bundle

### `UA-1 / G0-3 / C1`

Confirm all of the following:

1. Candidate partner legal/API terms are attached in [v22.0 Evidence Workspace / C1](v22-0-evidence/c1-partner-terms/README.md).
2. Submission ID matches the dated submission filename prefix.
3. Artifact inventory uses the canonical header, includes non-placeholder
   source metadata, marks at least one artifact as used in the clause matrix,
   and maps each clause-matrix source artifact to an Artifact ID or Filename /
   location.
4. Clause matrix uses the canonical header and has exactly one row for each
   required clause ID (`C1-1` through `C1-4`).
5. Any non-pass clause has explicit notes/rationale and a required mitigation
   or fallback in the clause matrix.
6. Final legal recommendation is present with reviewer and date.
7. Submission `Date` and `Sign-off date` use `YYYY-MM-DD`.

### `UA-3 / G0-8 / D4`

Confirm all of the following:

1. Named pilot partner list is attached in [v22.0 Evidence Workspace / D4](v22-0-evidence/d4-partner-ops/README.md).
2. Submission ID matches the dated submission filename prefix.
3. Artifact inventory uses the canonical header, includes non-placeholder
   source metadata, marks at least one artifact as supporting an outreach-log
   row, and maps each outreach-log `source_artifact` to an Artifact ID or
   Filename / location.
4. Partner list uses the canonical header, exact partner types of `provider` or
   `frontline organization`, and no duplicate organization rows.
5. Outreach owner is explicitly named.
6. Dated contact attempts are recorded in the outreach bundle.
7. Coverage note includes targeted counts and any remaining gaps.
8. The outreach log follows the canonical CSV header and each execution row has
   a `YYYY-MM-DD` date, positive `attempt_number`, outcome, owner, and
   `source_artifact` reference.
9. Target and contact-attempt counts in the D4 submission are positive
   integers.
10. Submitted counts match the attached artifacts: provider rows, frontline
    organization rows, and outreach-log execution rows.

## Step 2: Update the Source Record First

Apply the first source-of-truth update before touching the aggregate trackers.

### For `UA-1 / C1`

Update, in this order:

1. [v22.0 Control C1 Legal Review](v22-0-control-c1-legal-review.md)
2. [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md)

Required sync points:

1. Evidence table links
2. Control status
3. Blocking finding notes
4. Final recommendation or disposition

### For `UA-3 / D4`

Update:

1. [v22.0 Approval Checklist](../planning/v22-0-approval-checklist.md)

Required sync points:

1. Evidence reference for the D4 partner target record
2. Any dated execution note needed for audit traceability

## Step 3: Update the Aggregate Gate Trackers

After the source record is current, update:

1. [v22.0 Gate 0 User Action Tracker](v22-0-gate-0-user-action-tracker.md)
2. [v22.0 Gate 0 Evidence Status (2026-03-09)](v22-0-gate-0-evidence-status-2026-03-09.md)
3. [v22.0 Gate 0 Exit Checklist (Decision Control)](v22-0-gate-0-exit-checklist.md)

Required sync points:

1. `status`
2. `last update`
3. blocker notes
4. checklist pass/pending state
5. overall Gate 0 decision, if all blockers are now closed

## Step 4: Re-Run Evidence and Gate Checks

Run:

```bash
npm run check:v22-evidence
npm run check:v22-gate0
```

Interpretation:

1. `npm run check:v22-evidence` must pass before a closure decision is accepted.
2. `BLOCKED` with `G0-3` or `G0-8` is expected if only one blocker has been closed.
3. `OK` from `npm run check:v22-gate0` is valid only when the checklist decision is `GO` and every `G0-*` row is `pass`.
4. Any mismatch between the checklist and the script output means the synced docs are inconsistent and must be corrected before further work.

## Step 5: Preserve Evidence Discipline

1. Keep raw evidence artifacts in the dated workspace folder used for the review.
2. Do not remove superseded evidence bundles; add a newer dated bundle instead.
3. If the evidence is incomplete, leave the blocker `pending` and record exactly what is still missing.
