---
status: draft
last_updated: 2026-06-12
owner: jer
tags: [implementation, v22.0, gate-0, evidence, intake]
---

# v22.0 Gate 0 Evidence Intake Pack

This document defines the minimum evidence package needed to close user-owned Gate 0 blockers.

Use with:

1. [v22.0 Gate 0 User Action Tracker](v22-0-gate-0-user-action-tracker.md)
2. [v22.0 Gate 0 Evidence Status (2026-03-09)](v22-0-gate-0-evidence-status-2026-03-09.md)
3. [v22.0 Gate 0 Exit Checklist (Decision Control)](v22-0-gate-0-exit-checklist.md)
4. [v22.0 Integration Feasibility Decision Record](v22-0-integration-feasibility-decision.md)
5. [v22.0 Gate 0 Evidence Sync Runbook](v22-0-gate-0-evidence-sync-runbook.md)

Rules:

1. Do not mark any blocker `complete` unless all minimum evidence checks pass.
2. Evidence must be dated and attributable (owner/reviewer).
3. No fabricated evidence or inferred closure is allowed.
4. Canonical drop locations for new submissions live under [v22.0 Gate 0 Evidence Workspace](v22-0-evidence/README.md).
5. Prefer dated filenames so later gate reviews can trace the exact evidence bundle used.

## Intake Template: UA-1 / G0-3 (C1 Legal)

Submission template:

```text
Submission ID: C1-YYYYMMDD
Submitted by:
Date:
Partner artifact bundle location:
Included artifacts:
- Contract terms
- API terms
- Relevant addenda

Clause review outcomes:
- C1-1 (raw query text): pass/fail + note
- C1-2 (forced identifying telemetry): pass/fail + note
- C1-3 (re-identification requirement): pass/fail + note
- C1-4 (privacy-first standards conflict): pass/fail + note

Final legal recommendation: acceptable | acceptable_with_conditions | not_acceptable
Reviewer:
```

Suggested drop location:

1. [v22.0 Evidence Workspace / C1](v22-0-evidence/c1-partner-terms/README.md)

Suggested dated artifacts:

1. `C1-YYYYMMDD-submission.md`
2. `C1-YYYYMMDD-clause-matrix.md`
3. `C1-YYYYMMDD-artifact-inventory.md`
4. Raw source artifacts (PDF, HTML export, or markdown notes) used for the review

Supporting templates:

1. [C1 Submission Template](v22-0-evidence/c1-partner-terms/SUBMISSION_TEMPLATE.md)
2. [C1 Clause Matrix Template](v22-0-evidence/c1-partner-terms/CLAUSE_MATRIX_TEMPLATE.md)
3. [C1 Artifact Inventory Template](v22-0-evidence/c1-partner-terms/ARTIFACT_INVENTORY_TEMPLATE.md)

Minimum evidence checks:

- [ ] Partner legal/API terms bundle is attached and accessible.
- [ ] Submission ID matches the dated submission filename prefix.
- [ ] Artifact inventory uses the canonical template header and maps each
      clause-matrix source artifact to an Artifact ID or Filename / location
      marked `Used in clause matrix` = `yes`.
- [ ] Clause matrix uses the canonical template header and exactly one row for
      each required clause ID (`C1-1` through `C1-4`).
- [ ] Any non-pass clause includes explicit notes/rationale and a required
      mitigation or fallback.
- [ ] Final legal recommendation is present and signed.
- [ ] Submission `Date` and `Sign-off date` use `YYYY-MM-DD`.

Pass rule:

1. All checks above are complete.
2. C1-3 is explicitly resolved with no unresolved requirement.

## Intake Template: UA-2 / G0-4 (C2 Retention + Deletion)

Submission template:

```text
Submission ID: C2-YYYYMMDD
Submitted by:
Date:
Policy artifact location:

Field-level policy table:
- field:
  retention_window:
  deletion_trigger:
  deletion_executor:
  verification_evidence:

Privacy sign-off:
- Reviewer:
- Date:
- Decision: approved | approved_with_conditions | rejected
```

Suggested drop location:

1. [v22.0 Evidence Workspace / C2](v22-0-evidence/c2-retention/README.md)

Minimum evidence checks:

- [ ] Retention window defined for every allowed integration field.
- [ ] Deletion trigger and deletion executor defined for every allowed field.
- [ ] Verification evidence attached for deletion path behavior.
- [ ] Privacy sign-off included with reviewer/date/decision.

Pass rule:

1. No allowed field remains `pending policy lock`.
2. Privacy sign-off decision is `approved` or `approved_with_conditions`.

## Intake Template: UA-3 / G0-8 (D4 Partner Ops Execution)

Submission template:

```text
Submission ID: D4-YYYYMMDD
Submitted by:
Date:
Pilot partner list artifact:
Outreach owner:
Execution evidence bundle:
- outreach log
- dated contact attempts
- outcomes/status notes

Coverage note:
- Number of partners targeted:
- Number of organizations targeted:
- Gaps remaining:
```

Suggested drop location:

1. [v22.0 Evidence Workspace / D4](v22-0-evidence/d4-partner-ops/README.md)

Suggested dated artifacts:

1. `D4-YYYYMMDD-submission.md`
2. `D4-YYYYMMDD-partner-list.md`
3. `D4-YYYYMMDD-outreach-log.csv`
4. `D4-YYYYMMDD-artifact-inventory.md`
5. `D4-YYYYMMDD-coverage-note.md`
6. Any dated screenshots, email exports, or CRM notes used as supporting evidence

Supporting templates:

1. [D4 Submission Template](v22-0-evidence/d4-partner-ops/SUBMISSION_TEMPLATE.md)
2. [D4 Partner List Template](v22-0-evidence/d4-partner-ops/PARTNER_LIST_TEMPLATE.md)
3. [D4 Outreach Log Template](v22-0-evidence/d4-partner-ops/OUTREACH_LOG_TEMPLATE.csv)
4. [D4 Artifact Inventory Template](v22-0-evidence/d4-partner-ops/ARTIFACT_INVENTORY_TEMPLATE.md)

Minimum evidence checks:

- [ ] Named pilot partner list is attached.
- [ ] Submission ID matches the dated submission filename prefix.
- [ ] Artifact inventory uses the canonical template header and maps each
      outreach-log `source_artifact` to an Artifact ID or Filename / location
      marked `Supports outreach-log row` = `yes`.
- [ ] Partner list uses the canonical template header, no duplicate
      organization rows, and exact partner types of `provider` or
      `frontline organization`.
- [ ] Outreach owner is explicitly identified.
- [ ] Dated execution evidence bundle is attached.
- [ ] Coverage note includes targeted counts and any remaining gaps.
- [ ] Outreach log uses the canonical CSV header, `YYYY-MM-DD` dates, positive
      `attempt_number` values, and a `source_artifact` reference on each
      execution row.
- [ ] Target and contact-attempt counts are positive integers.
- [ ] Submitted target and contact-attempt counts match the partner-list rows
      and outreach-log execution rows.

Pass rule:

1. All checks above are complete.
2. Evidence aligns with D4 target range and is sufficient for audit traceability.

## Acceptance and Sync Steps

After any accepted submission:

1. Update status row in [v22.0 Gate 0 User Action Tracker](v22-0-gate-0-user-action-tracker.md).
2. Sync the corresponding control/evidence docs (C1 or C2, plus approval checklist for D4).
3. Sync [v22.0 Gate 0 Evidence Status (2026-03-09)](v22-0-gate-0-evidence-status-2026-03-09.md).
4. Re-evaluate [v22.0 Gate 0 Exit Checklist (Decision Control)](v22-0-gate-0-exit-checklist.md).
5. Re-run evidence-intake validation (`npm run check:v22-evidence`).
6. Re-run gate check (`npm run check:v22-gate0`).

## Machine Validation

Use `npm run check:v22-evidence` before any Gate 0 re-review. The guard is
status-aware:

1. It passes while `UA-1/G0-3` and `UA-3/G0-8` remain pending and only
   `prep_only` scaffolds exist.
2. It fails if either blocker is marked `complete` or `pass` while the
   corresponding evidence bundle is still `prep_only`.
3. For C1 closure, it validates the canonical artifact-inventory header,
   non-placeholder inventory rows, at least one artifact marked used in the
   clause matrix, and clause-matrix source references against inventory Artifact
   IDs or Filename / location values.
4. For C1 closure, it validates the canonical matrix header, exactly one row
   for each required clause, source references, outcomes, and
   rationale/mitigation fields for non-pass clause outcomes.
5. For D4 closure, it validates the artifact-inventory canonical header,
   non-placeholder inventory rows, at least one artifact marked as supporting
   an outreach-log row, and outreach-log `source_artifact` values against
   inventory Artifact IDs or Filename / location values.
6. For D4 closure, it validates the partner-list canonical header, exact
   partner types, duplicate organization rows, target range, and the outreach
   log's canonical header, date format, attempt numbers, and artifact
   traceability fields.
7. For C1/D4 closure submissions, it validates that `Submission ID` matches
   the dated submission filename prefix, `YYYY-MM-DD` submission dates, and
   positive integer D4 target/contact-attempt counts.
8. It compares D4 submitted counts against the attached partner-list and
   outreach-log artifacts.
9. It checks only evidence-structure and status consistency. It does not make
   legal, partner-quality, or outreach-sufficiency judgments.

Detailed operator sequence:

1. [v22.0 Gate 0 Evidence Sync Runbook](v22-0-gate-0-evidence-sync-runbook.md)
